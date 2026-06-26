import dotenv from "dotenv";
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    user:     process.env.DB_USER     || 'routeopt',
    password: process.env.DB_PASSWORD || 'routeopt_pass',
    name:     process.env.DB_NAME     || 'routeopt',
  },
   redis: {
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  jwt: {
    secret:    process.env.JWT_SECRET    || 'change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  fuelPrice: parseFloat(process.env.FUEL_PRICE_PER_LITER || '1.85'),
};
