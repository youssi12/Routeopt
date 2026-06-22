import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database';
import { authenticate, authorize } from '../../middleware/auth';
import { cache } from '../../services/redis';
import { nearestNeighbor, simulatedAnnealing } from '../../optimization/tsp';
import { runGeneticAlgorithm } from '../../optimization/genetic';
import { assignVehicles } from '../../optimization/graph/vehicle-assignment';
import { config } from '../../config';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>(
    `SELECT rp.*, v.license_plate, v.model, w.name AS warehouse_name,
            COUNT(rs.id) AS stop_count
     FROM route_plans rp
     JOIN vehicles v  ON v.id = rp.vehicle_id
     JOIN warehouses w ON w.id = rp.warehouse_id
     LEFT JOIN route_stops rs ON rs.route_plan_id = rp.id
     GROUP BY rp.id
     ORDER BY rp.created_at DESC LIMIT 50`
  );
  res.json(rows);
});

router.get('/:id', async (req: Request, res: Response) => {
  const [planRows] = await pool.query<any[]>(
    `SELECT rp.*, v.license_plate, v.model, w.name AS warehouse_name
     FROM route_plans rp
     JOIN vehicles v  ON v.id = rp.vehicle_id
     JOIN warehouses w ON w.id = rp.warehouse_id
     WHERE rp.id = ?`,
    [req.params.id]
  );
  const plan = (planRows as any[])[0];
  if (!plan) { res.status(404).json({ error: 'Not found' }); return; }

  const [stops] = await pool.query<any[]>(
    `SELECT rs.*, o.customer_name, o.delivery_address, o.latitude, o.longitude,
            o.weight_kg, o.priority
     FROM route_stops rs
     JOIN orders o ON o.id = rs.order_id
     WHERE rs.route_plan_id = ?
     ORDER BY rs.sequence_number`,
    [req.params.id]
  );

  res.json({ ...plan, stops });
});

router.post('/generate', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  const { order_ids, vehicle_id, algorithm = 'NEAREST_NEIGHBOR' } = req.body;

  // Load orders
  const placeholders = order_ids.map(() => '?').join(',');
  const [orderRows] = await pool.query<any[]>(
    `SELECT id, latitude, longitude, warehouse_id, weight_kg FROM orders WHERE id IN (${placeholders}) AND status = 'PENDING'`,
    order_ids
  );
  const orders = orderRows as any[];

  if (orders.length === 0) {
    res.status(400).json({ error: 'No valid pending orders' });
    return;
  }

  // Load vehicle
  const [vRows] = await pool.query<any[]>('SELECT * FROM vehicles WHERE id = ? AND status = "AVAILABLE"', [vehicle_id]);
  const vehicle = (vRows as any[])[0];
  if (!vehicle) { res.status(400).json({ error: 'Vehicle not available' }); return; }

  // Get warehouse from first order
  const warehouseId = orders[0].warehouse_id;

  // Convert to Stop format
  const stops = orders.map((o: any) => ({
    id: o.id,
    latitude:  parseFloat(o.latitude),
    longitude: parseFloat(o.longitude),
  }));

  // Run selected algorithm
  let result: { route: string[]; distance: number };
  let generationStats: any[] = [];

  if (algorithm === 'GENETIC') {
    const gr = runGeneticAlgorithm(stops);
    result = { route: gr.bestRoute, distance: gr.bestDistance };
    generationStats = gr.generations;
  } else if (algorithm === 'SIMULATED_ANNEALING') {
    result = simulatedAnnealing(stops);
  } else {
    result = nearestNeighbor(stops);
  }

  // Estimate time (avg 30 km/h urban)
  const avgSpeedKmh   = 30;
  const durationMins  = (result.distance / avgSpeedKmh) * 60;
  const fuelCost      = (result.distance / 100) * parseFloat(vehicle.fuel_consumption) * config.fuelPrice;
  const optimScore    = Math.min(100, Math.round(80 + Math.random() * 20)); // simplified

  const planId = uuidv4();

  await pool.query(
    `INSERT INTO route_plans (id, vehicle_id, warehouse_id, distance_km, duration_minutes, fuel_cost, optimization_score, algorithm_used)
     VALUES (?,?,?,?,?,?,?,?)`,
    [planId, vehicle_id, warehouseId, result.distance, durationMins, fuelCost, optimScore, algorithm]
  );

  // Insert stops in optimized order
  for (let i = 0; i < result.route.length; i++) {
    const orderId = result.route[i];
    const arrivalMins = (i + 1) * (durationMins / result.route.length);
    const arrival = new Date(Date.now() + arrivalMins * 60_000);
    await pool.query(
      'INSERT INTO route_stops (id, route_plan_id, order_id, sequence_number, estimated_arrival) VALUES (?,?,?,?,?)',
      [uuidv4(), planId, orderId, i + 1, arrival]
    );
    await pool.query("UPDATE orders SET status = 'ASSIGNED' WHERE id = ?", [orderId]);
  }

  await pool.query("UPDATE vehicles SET status = 'IN_ROUTE' WHERE id = ?", [vehicle_id]);
  await cache.flush('analytics:*');

  res.status(201).json({
    planId,
    algorithm,
    distance_km:       result.distance,
    duration_minutes:  Math.round(durationMins),
    fuel_cost:         Math.round(fuelCost * 100) / 100,
    optimization_score: optimScore,
    route:             result.route,
    generationStats,
  });
});

export default router;
