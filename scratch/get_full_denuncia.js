const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://user_denuncias:zq7gC7Cqyy8eFUl08GBL8ny6YgyX@178.104.197.196:5432/denuncias_dchpef?sslmode=disable",
  ssl: false
});

async function getFullDenuncia() {
  try {
    const res = await pool.query(`
      SELECT 
        d.id, 
        d.orden, 
        d.fecha_denuncia, 
        d.tipo_denuncia,
        d.relato,
        den.nombres as denunciante, 
        den.cedula,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido
      FROM denuncias d
      LEFT JOIN denunciantes den ON d.denunciante_id = den.id
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.id = 1636
    `);
    
    if (res.rows.length > 0) {
      console.log(JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('No encontrada');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

getFullDenuncia();
