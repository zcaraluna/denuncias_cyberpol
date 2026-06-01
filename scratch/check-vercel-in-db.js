const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function main() {
  console.log("🔍 Buscando posibles enlaces de Vercel Blob en la base de datos...");
  try {
    // Buscar en archivo_denuncia_url y adjuntos_urls
    const query = `
      SELECT id, archivo_denuncia_url, adjuntos_urls 
      FROM denuncias 
      WHERE archivo_denuncia_url ILIKE '%vercel%'
         OR EXISTS (
           SELECT 1 FROM unnest(adjuntos_urls) url WHERE url ILIKE '%vercel%'
         )
    `;

    const result = await pool.query(query);

    if (result.rows.length > 0) {
      console.log(`❌ Se encontraron ${result.rows.length} denuncias que aún contienen enlaces a Vercel:\n`);
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`📄 archivo_denuncia_url: ${row.archivo_denuncia_url}`);
        console.log(`📎 adjuntos_urls: ${JSON.stringify(row.adjuntos_urls)}`);
        console.log(`-------------------------------------------------------------------`);
      });
    } else {
      console.log("✅ ¡Excelente! No se encontró ninguna denuncia con enlaces a Vercel Blob en la base de datos.");
    }
  } catch (error) {
    console.error("❌ Error al consultar la base de datos:", error.message || error);
  } finally {
    await pool.end();
  }
}

main();
