require('dotenv').config();
const { Pool } = require('pg');

// Usar POSTGRES_URL_NON_POOLING que no tiene parámetros problemáticos
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING
});

async function checkOperadorData() {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                orden,
                operador_grado,
                operador_nombre,
                operador_apellido,
                fecha_denuncia
            FROM denuncias
            WHERE estado = 'completada'
            ORDER BY id DESC
            LIMIT 5
        `);

        console.log('\n=== ÚLTIMAS 5 DENUNCIAS - DATOS DEL OPERADOR ===\n');
        result.rows.forEach(row => {
            console.log(`ID: ${row.id} | Orden: ${row.orden}`);
            console.log(`  operador_grado: "${row.operador_grado}" (tipo: ${typeof row.operador_grado}, null: ${row.operador_grado === null})`);
            console.log(`  operador_nombre: "${row.operador_nombre}" (tipo: ${typeof row.operador_nombre}, null: ${row.operador_nombre === null})`);
            console.log(`  operador_apellido: "${row.operador_apellido}" (tipo: ${typeof row.operador_apellido}, null: ${row.operador_apellido === null})`);
            console.log(`  Fecha: ${row.fecha_denuncia}`);
            console.log('---');
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkOperadorData();
