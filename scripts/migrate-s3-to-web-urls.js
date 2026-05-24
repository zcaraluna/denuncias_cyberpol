const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Obtener la URL pública de reemplazo
const targetDomain = 's3.s1mple.cloud';
const publicEndpoint = process.env.GARAGE_PUBLIC_URL || 'https://web.s1mple.cloud';
const replacementDomain = new URL(publicEndpoint).host;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function runReplacement() {
  console.log(`🚀 Iniciando reemplazo de dominios en la base de datos...`);
  console.log(`❌ Buscar: ${targetDomain}`);
  console.log(`✅ Reemplazar con: ${replacementDomain}\n`);

  try {
    // 1. Buscar denuncias que tengan el dominio s3.s1mple.cloud
    const query = `
      SELECT id, archivo_denuncia_url, adjuntos_urls 
      FROM denuncias 
      WHERE archivo_denuncia_url ILIKE $1
         OR EXISTS (
           SELECT 1 FROM unnest(adjuntos_urls) url WHERE url ILIKE $2
         )
    `;

    const result = await pool.query(query, [`%${targetDomain}%`, `%${targetDomain}%`]);

    console.log(`📊 Encontradas ${result.rows.length} denuncias que contienen '${targetDomain}'.\n`);

    let updatedCount = 0;

    for (const row of result.rows) {
      let updatedArchivoUrl = row.archivo_denuncia_url;
      let updatedAdjuntosUrls = row.adjuntos_urls ? [...row.adjuntos_urls] : [];
      let needsUpdate = false;

      // Actualizar archivo principal
      if (row.archivo_denuncia_url && row.archivo_denuncia_url.includes(targetDomain)) {
        const newUrl = row.archivo_denuncia_url.replace(targetDomain, replacementDomain);
        console.log(`🔹 [Denuncia ${row.id}] Archivo principal:`);
        console.log(`   ❌ Viejo: ${row.archivo_denuncia_url}`);
        console.log(`   ✅ Nuevo: ${newUrl}`);
        updatedArchivoUrl = newUrl;
        needsUpdate = true;
      }

      // Actualizar adjuntos
      if (row.adjuntos_urls && row.adjuntos_urls.length > 0) {
        for (let i = 0; i < row.adjuntos_urls.length; i++) {
          const urlStr = row.adjuntos_urls[i];
          if (urlStr && urlStr.includes(targetDomain)) {
            const newUrl = urlStr.replace(targetDomain, replacementDomain);
            console.log(`🔹 [Denuncia ${row.id}] Adjunto [${i}]:`);
            console.log(`   ❌ Viejo: ${urlStr}`);
            console.log(`   ✅ Nuevo: ${newUrl}`);
            updatedAdjuntosUrls[i] = newUrl;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await pool.query(
          `UPDATE denuncias 
           SET archivo_denuncia_url = $1, 
               adjuntos_urls = $2 
           WHERE id = $3`,
          [updatedArchivoUrl, updatedAdjuntosUrls, row.id]
        );
        updatedCount++;
        console.log(`   💾 Guardado con éxito.\n`);
      }
    }

    console.log(`===================================================================`);
    console.log(`🏁 Proceso Finalizado`);
    console.log(`- Registros actualizados con éxito: ${updatedCount}`);
    console.log(`===================================================================`);

  } catch (error) {
    console.error("❌ Error durante la actualización:", error.message || error);
  } finally {
    await pool.end();
  }
}

runReplacement();
