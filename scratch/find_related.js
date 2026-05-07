const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://user_denuncias:zq7gC7Cqyy8eFUl08GBL8ny6YgyX@178.104.197.196:5432/denuncias_dchpef?sslmode=disable",
  ssl: false
});

async function findRelatedTables() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'denuncia_id'
    `);
    console.log('Tablas relacionadas por denuncia_id:');
    res.rows.forEach(r => console.log(`- ${r.table_name}`));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

findRelatedTables();
