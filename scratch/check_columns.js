const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://user_denuncias:zq7gC7Cqyy8eFUl08GBL8ny6YgyX@178.104.197.196:5432/denuncias_dchpef?sslmode=disable",
  ssl: false
});

async function checkTableStructure() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'denuncias'
    `);
    console.log('Columnas de la tabla denuncias:');
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
