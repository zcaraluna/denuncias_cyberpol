require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkRoles() {
    try {
        const result = await pool.query(`
            SELECT rol, con_carta_poder, COUNT(*) as count
            FROM denuncias_involucrados
            GROUP BY rol, con_carta_poder
            ORDER BY count DESC
        `);

        console.log('\n=== Roles en denuncias_involucrados ===');
        console.table(result.rows);

        const sample = await pool.query(`
            SELECT di.rol, di.con_carta_poder, den.nombres
            FROM denuncias_involucrados di
            INNER JOIN denunciantes den ON den.id = di.denunciante_id
            LIMIT 5
        `);

        console.log('\n=== Muestra de datos ===');
        console.table(sample.rows);

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkRoles();
