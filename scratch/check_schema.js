const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString.replace(/:[^:]+@/, ':****@'));

const pool = new Pool({
    connectionString,
    ssl: false
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'denuncias'
      ORDER BY column_name
    `);
        console.log('Columns in "denuncias" table:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
    } catch (err) {
        console.error('Error executing query:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
