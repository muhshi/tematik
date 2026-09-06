import postgres from 'postgres';
import { config } from 'dotenv';
config(); // Load .env file for standalone scripts


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

// Gunakan global singleton di development untuk mencegah connection pool exhaustion (CONNECT_TIMEOUT) akibat hot-reload Next.js
const globalForPostgres = global as unknown as { sql: postgres.Sql };

export const sql =
  globalForPostgres.sql ||
  postgres(connectionString, {
    ssl: 'require',
    max: 10,
    idle_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForPostgres.sql = sql;
