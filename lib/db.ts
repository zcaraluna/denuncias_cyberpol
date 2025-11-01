import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';
// Solo usar SSL si la URL lo especifica explícitamente
const useSSL = connectionString.includes('sslmode=require') || connectionString.includes('ssl=true');

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export default pool;

