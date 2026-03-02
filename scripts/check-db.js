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

async function checkDb() {
    let output = '';
    try {
        const res = await pool.query('SELECT current_database(), current_user');
        output += `Connected to: ${JSON.stringify(res.rows[0])}\n`;

        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
        output += 'Tables in public schema:\n';
        tables.rows.forEach(row => {
            output += ` - ${row.table_name}\n`;
        });

        const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'denuncia_firmas'
      )
    `);
        output += `\ndenuncia_firmas exists: ${checkTable.rows[0].exists}\n`;

        fs.writeFileSync(path.join(__dirname, 'db-check-results.txt'), output);
        console.log('Results written to db-check-results.txt');

        await pool.end();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkDb();
