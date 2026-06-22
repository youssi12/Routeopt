import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database';
import { authenticate, authorize } from '../../middleware/auth';
import { cache } from '../../services/redis';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response) => {
  const cached = await cache.get('vehicles:all');
  if (cached) { res.json(cached); return; }

  const [rows] = await pool.query<any[]>('SELECT * FROM vehicles ORDER BY license_plate');
  await cache.set('vehicles:all', rows, 60);
  res.json(rows);
});

router.get('/:id', async (req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
  const v = (rows as any[])[0];
  if (!v) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(v);
});

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  const { license_plate, model, capacity_kg, fuel_consumption } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO vehicles (id, license_plate, model, capacity_kg, fuel_consumption) VALUES (?,?,?,?,?)',
    [id, license_plate, model, capacity_kg, fuel_consumption]
  );
  await cache.del('vehicles:all');
  res.status(201).json({ id, message: 'Vehicle created' });
});

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  const { status, current_latitude, current_longitude } = req.body;
  await pool.query(
    'UPDATE vehicles SET status = COALESCE(?,status), current_latitude = COALESCE(?,current_latitude), current_longitude = COALESCE(?,current_longitude) WHERE id = ?',
    [status, current_latitude, current_longitude, req.params.id]
  );
  await cache.del('vehicles:all');
  res.json({ message: 'Updated' });
});

export default router;
