const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://user_denuncias:zq7gC7Cqyy8eFUl08GBL8ny6YgyX@178.104.197.196:5432/denuncias_dchpef?sslmode=disable",
  ssl: false
});

async function checkStatus() {
  try {
    const res = await pool.query(`SELECT estado FROM denuncias WHERE id = 1636`);
    if (res.rows.length > 0) {
      console.log('Estado:', res.rows[0].estado);
    } else {
      console.log('No encontrada');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkStatus();
