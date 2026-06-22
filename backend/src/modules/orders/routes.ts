import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database';
import { authenticate, authorize } from '../../middleware/auth';
import { cache } from '../../services/redis';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const { status, priority, warehouse_id, limit = '50', offset = '0' } = req.query as Record<string, string>;
  const conditions: string[] = [];
  const params: any[] = [];

  if (status)       { conditions.push('o.status = ?');       params.push(status); }
  if (priority)     { conditions.push('o.priority = ?');     params.push(priority); }
  if (warehouse_id) { conditions.push('o.warehouse_id = ?'); params.push(warehouse_id); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [rows] = await pool.query<any[]>(
    `SELECT o.*, w.name AS warehouse_name FROM orders o
     JOIN warehouses w ON w.id = o.warehouse_id
     ${where}
     ORDER BY
       CASE o.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
       o.deadline ASC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  const [countRow] = await pool.query<any[]>(
    `SELECT COUNT(*) AS total FROM orders o ${where}`, params
  );

  res.json({ data: rows, total: (countRow as any[])[0].total });
});

router.get('/:id', async (req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>(
    `SELECT o.*, w.name AS warehouse_name FROM orders o
     JOIN warehouses w ON w.id = o.warehouse_id WHERE o.id = ?`,
    [req.params.id]
  );
  const order = (rows as any[])[0];
  if (!order) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(order);
});

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  const { warehouse_id, customer_name, delivery_address, latitude, longitude, weight_kg, priority, deadline, notes } = req.body;
  const id = uuidv4();
  await pool.query(
    `INSERT INTO orders (id, warehouse_id, customer_name, delivery_address, latitude, longitude, weight_kg, priority, deadline, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, warehouse_id, customer_name, delivery_address, latitude, longitude, weight_kg, priority, deadline, notes]
  );
  await cache.flush('analytics:*');
  res.status(201).json({ id, message: 'Order created' });
});

router.patch('/:id', authorize('ADMIN', 'MANAGER', 'DISPATCHER'), async (req: Request, res: Response) => {
  const { status } = req.body;
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  await cache.flush('analytics:*');
  res.json({ message: 'Order updated' });
});

export default router;
