import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database';
import { config } from '../../config';
import { AuthRequest } from '../../middleware/auth';

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, role = 'DISPATCHER' } = req.body;

  const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE email = ?', [email]);
  if ((existing as any[]).length > 0) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const id   = uuidv4();

  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?,?,?,?,?)',
    [id, name, email, hash, role]
  );

  res.status(201).json({ message: 'User created', id });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const [rows] = await pool.query<any[]>(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
    [email]
  );
  const user = (rows as any[])[0];

  if (!user || !user.is_active) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function profile(req: AuthRequest, res: Response): Promise<void> {
  const [rows] = await pool.query<any[]>(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [req.user!.id]
  );
  const user = (rows as any[])[0];
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
}
