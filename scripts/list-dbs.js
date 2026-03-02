const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

const pool = new Pool({
    connectionString: (process.env.DATABASE_URL || '').replace('sslmode=require', 'sslmode=disable'),
    ssl: { rejectUnauthorized: false },
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkAllDbs() {
    try {
        const res = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
        console.log('Databases on this server:');
        res.rows.forEach(row => console.log(' -', row.datname));

        const curr = await pool.query('SELECT current_database()');
        console.log('\nCurrently connected to:', curr.rows[0].current_database);

        await pool.end();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkAllDbs();
