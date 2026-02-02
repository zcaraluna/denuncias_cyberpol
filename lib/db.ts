import { Pool } from 'pg';

// Forzar la desactivación de la validación de certificados TLS a nivel global para este proceso
// Esto soluciona los errores de 'self-signed certificate' en entornos con poolers (Supabase/Neon)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// Limpiar sslmode=require de la cadena para que no interfiera con la configuración del driver de JS
connectionString = connectionString.replace('sslmode=require', 'sslmode=disable');

// Configuración de SSL: Desactivar validación de certificados para conexiones remotas (necesario para Supabase/Poolers)
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const sslConfig = isLocal ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  // Configuración para entornos serverless (Vercel)
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

// Manejar errores de conexión y reconectar automáticamente
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
  // No hacer nada aquí, el pool manejará la reconexión automáticamente
});

// Función helper para ejecutar queries con retry automático
export async function queryWithRetry(
  text: string,
  params?: any[],
  retries: number = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      // Intentar ejecutar la query
      const result = await pool.query(text, params);
      return result;
    } catch (error: any) {
      // Si es un error de conexión y aún hay reintentos disponibles
      const isConnectionError =
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'EPIPE' ||
        error.message?.includes('Connection terminated') ||
        error.message?.includes('Connection closed') ||
        error.message?.includes('socket hang up');

      if (isConnectionError && i < retries - 1) {
        console.log(`Error de conexión detectado (${error.code}), reintentando query (intento ${i + 1}/${retries})...`);
        // Esperar un poco antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
        continue;
      }
      // Si no es un error de conexión o se agotaron los reintentos, lanzar el error
      throw error;
    }
  }
  throw new Error('No se pudo ejecutar la query después de múltiples intentos');
}

export default pool;

