const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

// Manually load .env.local to handle connection config
const envPath = path.join(__dirname, '..', '.env.local');
let poolConfig = {};

try {
    let envFile = fs.readFileSync(envPath, 'utf8').trim();

    if (envFile.startsWith('postgres')) {
        console.log('Utilizando cadena de conexión raw de .env.local');
        poolConfig = { connectionString: envFile };
    } else {
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
    console.error('Error al leer .env.local:', e.message);
    process.exit(1);
}

const pool = new Pool(poolConfig);

const isAsuncion = (oficinaName) => {
    if (!oficinaName) return false;
    const normalized = oficinaName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
    return normalized === 'ASUNCION';
};

async function eliminarDenunciasNoAsuncion() {
    const client = await pool.connect();
    try {
        console.log('--- INICIANDO PROCESO DE LIMPIEZA DE DENUNCIAS ---');
        console.log('Conectado a la base de datos.');

        // 1. Obtener estado inicial de denuncias por oficina
        const resInicial = await client.query(`
            SELECT oficina, COUNT(*) as cantidad 
            FROM denuncias 
            GROUP BY oficina 
            ORDER BY cantidad DESC
        `);

        console.log('\nDenuncias actuales en la base de datos por oficina:');
        let totalDenuncias = 0;
        let totalAEliminar = 0;
        
        if (resInicial.rows.length === 0) {
            console.log('  No se encontraron denuncias en la base de datos.');
            client.release();
            pool.end();
            return;
        }

        resInicial.rows.forEach(row => {
            const count = parseInt(row.cantidad, 10);
            totalDenuncias += count;
            const esAsu = isAsuncion(row.oficina);
            if (!esAsu) {
                totalAEliminar += count;
            }
            console.log(`  - Oficina: "${row.oficina}" | Cantidad: ${count} ${esAsu ? '(Se mantiene)' : '(Se eliminará)'}`);
        });

        console.log(`\nResumen inicial:`);
        console.log(`  Total denuncias: ${totalDenuncias}`);
        console.log(`  Denuncias de Asunción: ${totalDenuncias - totalAEliminar}`);
        console.log(`  Denuncias a eliminar (otras oficinas): ${totalAEliminar}`);

        if (totalAEliminar === 0) {
            console.log('\nNo existen denuncias de oficinas distintas a Asunción para eliminar.');
            client.release();
            pool.end();
            return;
        }

        // 2. Ejecutar la eliminación en una transacción
        console.log('\nIniciando transacción de eliminación...');
        await client.query('BEGIN');

        // Eliminar del historial de denuncias (tabla sin FK de cascada)
        const resHistorial = await client.query(`
            DELETE FROM historial_denuncias 
            WHERE hash_denuncia IN (
                SELECT hash FROM denuncias 
                WHERE TRIM(LOWER(oficina)) NOT IN ('asuncion', 'asunción')
            )
        `);
        console.log(`- Se eliminaron ${resHistorial.rowCount} registros correspondientes en la tabla "historial_denuncias".`);

        // Eliminar de denuncias (cascadeará a involucrados, supuestos autores, visitas y ampliaciones)
        const resDenuncias = await client.query(`
            DELETE FROM denuncias 
            WHERE TRIM(LOWER(oficina)) NOT IN ('asuncion', 'asunción')
        `);
        console.log(`- Se eliminaron ${resDenuncias.rowCount} denuncias de la tabla "denuncias" (y cascada asociada).`);

        await client.query('COMMIT');
        console.log('Transacción confirmada (COMMIT) con éxito.');

        // 3. Obtener estado final
        const resFinal = await client.query(`
            SELECT oficina, COUNT(*) as cantidad 
            FROM denuncias 
            GROUP BY oficina 
            ORDER BY cantidad DESC
        `);

        console.log('\nEstado final de las denuncias en la base de datos:');
        if (resFinal.rows.length === 0) {
            console.log('  No quedan denuncias en la base de datos.');
        } else {
            resFinal.rows.forEach(row => {
                console.log(`  - Oficina: "${row.oficina}" | Cantidad: ${row.cantidad}`);
            });
        }
        console.log('\n--- PROCESO DE LIMPIEZA FINALIZADO CON ÉXITO ---');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n[ERROR] Ocurrió un error al eliminar las denuncias. Se realizó ROLLBACK:', error);
    } finally {
        client.release();
        pool.end();
    }
}

eliminarDenunciasNoAsuncion();
