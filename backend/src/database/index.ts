import mysql from 'mysql2/promise';
import { config } from '../config';
import { logger } from '../utils/logger';

 export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,

  ssl: config.db.ssl
    ? {
        rejectUnauthorized: false,
      }
    : undefined,

  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
});
export async function connectDB(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    logger.info('✅ MySQL connected');
    conn.release();
  } catch (err) {
    logger.error('❌ MySQL connection failed', err);
    process.exit(1);
  }
}
