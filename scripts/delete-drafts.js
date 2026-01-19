const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

// Manually load .env.local to handle potential raw connection string
const envPath = path.join(__dirname, '..', '.env.local');
let poolConfig = {};

try {
    let envFile = fs.readFileSync(envPath, 'utf8').trim();

    if (envFile.startsWith('postgres')) {
        // It's a raw connection string
        console.log('Using raw connection string from .env.local');
        poolConfig = { connectionString: envFile };
    } else {
        // Normal .env format
        const lines = envFile.split('\n');
        const env = {};
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                env[key] = value;
            }
        }

        poolConfig = {
            user: env.DB_USER,
            host: env.DB_HOST,
            database: env.DB_NAME,
            password: env.DB_PASSWORD,
            port: env.DB_PORT,
        };
    }
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    // Fallback to trying process.env keys (unlikely to work without dotenv loading)
}

const pool = new Pool(poolConfig);

async function deleteDrafts() {
    const client = await pool.connect();
    try {
        console.log('Starting deletion of all drafts...');
        await client.query('BEGIN');

        // 1. Delete related records in denuncias_involucrados
        const resInvolucrados = await client.query(`
      DELETE FROM denuncias_involucrados 
      WHERE denuncia_id IN (SELECT id FROM denuncias WHERE estado = 'borrador')
    `);
        console.log(`Deleted ${resInvolucrados.rowCount} records from denuncias_involucrados`);

        // 2. Delete related records in supuestos_autores
        const resAutores = await client.query(`
      DELETE FROM supuestos_autores 
      WHERE denuncia_id IN (SELECT id FROM denuncias WHERE estado = 'borrador')
    `);
        console.log(`Deleted ${resAutores.rowCount} records from supuestos_autores`);

        // 3. Delete the drafts themselves from denuncias
        const resDenuncias = await client.query(`
      DELETE FROM denuncias 
      WHERE estado = 'borrador'
    `);
        console.log(`Deleted ${resDenuncias.rowCount} records from denuncias`);

        await client.query('COMMIT');
        console.log('Deletion completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting drafts:', error);
    } finally {
        client.release();
        pool.end();
    }
}

deleteDrafts();
