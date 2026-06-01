const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function main() {
  try {
    const result = await pool.query(
      `SELECT id, archivo_denuncia_url, adjuntos_urls 
       FROM denuncias 
       WHERE archivo_denuncia_url IS NOT NULL 
          OR (adjuntos_urls IS NOT NULL AND cardinality(adjuntos_urls) > 0)
       LIMIT 20`
    );

    console.log(`🔍 Encontradas ${result.rows.length} denuncias con archivos/adjuntos.`);
    console.log(`-------------------------------------------------------------------`);
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`📄 archivo_denuncia_url: ${row.archivo_denuncia_url}`);
      console.log(`📎 adjuntos_urls: ${JSON.stringify(row.adjuntos_urls)}`);
      console.log(`-------------------------------------------------------------------`);
    });

  } catch (error) {
    console.error("❌ Error al consultar la base de datos:", error);
  } finally {
    await pool.end();
  }
}

main();
