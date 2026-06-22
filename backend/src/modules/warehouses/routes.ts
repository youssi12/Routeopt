import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>(
    'SELECT * FROM warehouses WHERE is_active = 1 ORDER BY name'
  );
  res.json(rows);
});

router.get('/:id', async (req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
  const w = (rows as any[])[0];
  if (!w) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(w);
});

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  const { name, address, latitude, longitude } = req.body;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO warehouses (id, name, address, latitude, longitude) VALUES (?,?,?,?,?)',
    [id, name, address, latitude, longitude]
  );
  res.status(201).json({ id, message: 'Warehouse created' });
});

router.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response) => {
  await pool.query('UPDATE warehouses SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Warehouse deactivated' });
});

export default router;
