const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://user_denuncias:zq7gC7Cqyy8eFUl08GBL8ny6YgyX@178.104.197.196:5432/denuncias_dchpef?sslmode=disable",
  ssl: false
});

async function deleteDenuncia(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get denunciante_id before deleting the denuncia
    const denunciaResult = await client.query('SELECT denunciante_id FROM denuncias WHERE id = $1', [id]);
    if (denunciaResult.rows.length === 0) {
      console.log('Denuncia no encontrada.');
      await client.query('ROLLBACK');
      return;
    }
    const denuncianteId = denunciaResult.rows[0].denunciante_id;

    console.log(`Eliminando registros relacionados para la denuncia ID ${id}...`);

    await client.query('DELETE FROM ampliaciones_denuncia WHERE denuncia_id = $1', [id]);
    await client.query('DELETE FROM denuncia_firmas WHERE denuncia_id = $1', [id]);
    await client.query('DELETE FROM denuncias_involucrados WHERE denuncia_id = $1', [id]);
    await client.query('DELETE FROM supuestos_autores WHERE denuncia_id = $1', [id]);
    await client.query('DELETE FROM visitas_denuncias WHERE denuncia_id = $1', [id]);

    console.log(`Eliminando la denuncia ID ${id}...`);
    await client.query('DELETE FROM denuncias WHERE id = $1', [id]);

    // Check if the denunciante has other denuncias
    const otherDenuncias = await client.query('SELECT id FROM denuncias WHERE denunciante_id = $1', [denuncianteId]);
    if (otherDenuncias.rows.length === 0) {
      console.log(`Eliminando denunciante ID ${denuncianteId} (no tiene otras denuncias)...`);
      await client.query('DELETE FROM denunciantes WHERE id = $1', [denuncianteId]);
    }

    await client.query('COMMIT');
    console.log('Eliminación completada con éxito.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la eliminación:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteDenuncia(1636);
