import { Router, Request, Response } from 'express';
import { pool } from '../../database';
import { authenticate } from '../../middleware/auth';
import { cache } from '../../services/redis';
import { config } from '../../config';

const router = Router();
router.use(authenticate);

// ─── Dashboard KPIs ──────────────────────────────────────────
router.get('/dashboard', async (_req: Request, res: Response) => {
  const cached = await cache.get('analytics:dashboard');
  if (cached) { res.json(cached); return; }

  const [[orderStats]]   = await pool.query<any[]>(`
    SELECT
      COUNT(*) AS total_orders,
      SUM(status = 'PENDING')    AS pending,
      SUM(status = 'DELIVERED')  AS delivered,
      SUM(status = 'IN_TRANSIT') AS in_transit,
      SUM(status = 'FAILED')     AS failed
    FROM orders`);

  const [[vehicleStats]] = await pool.query<any[]>(`
    SELECT
      COUNT(*) AS total_vehicles,
      SUM(status = 'AVAILABLE')   AS available,
      SUM(status = 'IN_ROUTE')    AS in_route,
      SUM(status = 'MAINTENANCE') AS maintenance
    FROM vehicles`);

  const [[routeStats]]   = await pool.query<any[]>(`
    SELECT
      COUNT(*)           AS total_routes,
      SUM(status = 'ACTIVE') AS active_routes,
      COALESCE(SUM(distance_km), 0) AS total_distance,
      COALESCE(SUM(fuel_cost), 0)   AS total_fuel_cost,
      COALESCE(AVG(optimization_score), 0) AS avg_score
    FROM route_plans WHERE DATE(created_at) = CURDATE()`);

  const successRate =
    orderStats.total_orders > 0
      ? Math.round((orderStats.delivered / orderStats.total_orders) * 10000) / 100
      : 0;

  const dashboard = {
    orders:     orderStats,
    vehicles:   vehicleStats,
    routes:     routeStats,
    successRate,
    fuelCostToday: Math.round(parseFloat(routeStats.total_fuel_cost) * 100) / 100,
    distanceToday: Math.round(parseFloat(routeStats.total_distance) * 100) / 100,
  };

  await cache.set('analytics:dashboard', dashboard, 60);
  res.json(dashboard);
});

// ─── Orders per day (last 14 days) ───────────────────────────
router.get('/orders-trend', async (_req: Request, res: Response) => {
  const cached = await cache.get('analytics:orders-trend');
  if (cached) { res.json(cached); return; }

  const [rows] = await pool.query<any[]>(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS total,
      SUM(status = 'DELIVERED') AS delivered,
      SUM(status = 'FAILED')    AS failed
    FROM orders
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC`);

  await cache.set('analytics:orders-trend', rows, 300);
  res.json(rows);
});

// ─── Vehicle analytics ───────────────────────────────────────
router.get('/vehicles', async (_req: Request, res: Response) => {
  const cached = await cache.get('analytics:vehicles');
  if (cached) { res.json(cached); return; }

  const [rows] = await pool.query<any[]>(`
    SELECT
      v.id, v.license_plate, v.model, v.capacity_kg, v.status,
      COUNT(rp.id) AS total_routes,
      COALESCE(SUM(rp.distance_km), 0)  AS total_distance,
      COALESCE(SUM(rp.fuel_cost), 0)    AS total_fuel_cost,
      COALESCE(AVG(rp.optimization_score), 0) AS avg_score,
      COUNT(rs.id) AS total_deliveries
    FROM vehicles v
    LEFT JOIN route_plans rp ON rp.vehicle_id = v.id
    LEFT JOIN route_stops rs ON rs.route_plan_id = rp.id
    GROUP BY v.id
    ORDER BY total_distance DESC`);

  const enriched = rows.map((v: any) => ({
    ...v,
    total_distance:  Math.round(parseFloat(v.total_distance)  * 100) / 100,
    total_fuel_cost: Math.round(parseFloat(v.total_fuel_cost) * 100) / 100,
    avg_score:       Math.round(parseFloat(v.avg_score)       * 100) / 100,
  }));

  await cache.set('analytics:vehicles', enriched, 120);
  res.json(enriched);
});

// ─── Routes analytics ────────────────────────────────────────
router.get('/routes', async (_req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>(`
    SELECT
      rp.id, rp.algorithm_used, rp.distance_km, rp.duration_minutes,
      rp.fuel_cost, rp.optimization_score, rp.status, rp.created_at,
      v.license_plate,
      COUNT(rs.id) AS stop_count,
      SUM(rs.status = 'DELIVERED') AS delivered_count
    FROM route_plans rp
    JOIN vehicles v ON v.id = rp.vehicle_id
    LEFT JOIN route_stops rs ON rs.route_plan_id = rp.id
    GROUP BY rp.id
    ORDER BY rp.created_at DESC LIMIT 100`);
  res.json(rows);
});

// ─── Cost breakdown ──────────────────────────────────────────
router.get('/costs', async (_req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>(`
    SELECT
      DATE(created_at) AS date,
      SUM(fuel_cost)    AS fuel_cost,
      SUM(distance_km)  AS distance_km,
      COUNT(*)          AS routes
    FROM route_plans
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC`);
  res.json(rows);
});

export default router;
