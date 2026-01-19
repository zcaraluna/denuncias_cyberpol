const path = require('path');
const { Pool } = require('pg');
const fs = require('fs'); // Added fs module

// Load .env.local using dotenv
// require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') }); // This line will be replaced/modified

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
        // Normal .env format, let dotenv handle it (already required above, but let's re-parse just in case or rely on process.env)
        require('dotenv').config({ path: envPath });
        poolConfig = {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        };
    }
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    // Fallback to default dotenv loading if file read fails or is not found
    require('dotenv').config({ path: envPath });
    poolConfig = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };
}

const pool = new Pool(poolConfig);

async function listDrafts() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT 
        d.id, 
        d.fecha_denuncia, 
        d.hora_denuncia,
        d.estado,
        u.nombre as operador_nombre,
        u.apellido as operador_apellido,
        de.nombres as denunciante_principal
      FROM denuncias d
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN denunciantes de ON d.denunciante_id = de.id
      WHERE d.estado = 'borrador'
      ORDER BY d.id DESC
    `);

        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('Error listing drafts:', error);
    } finally {
        client.release();
        pool.end();
    }
}

listDrafts();
