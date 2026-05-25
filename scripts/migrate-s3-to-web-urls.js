const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Obtener la URL pública de destino
const targetWebUrl = process.env.GARAGE_PUBLIC_URL || 'https://web.s1mple.cloud';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function runReplacement() {
  console.log(`🚀 Iniciando reemplazo de dominios en la base de datos...`);
  console.log(`✅ Destino: ${targetWebUrl}\n`);

  try {
    // Buscar denuncias que tengan enlaces en formatos viejos
    const query = `
      SELECT id, archivo_denuncia_url, adjuntos_urls 
      FROM denuncias 
      WHERE archivo_denuncia_url ILIKE '%s3.s1mple.cloud/s1mple-cloud%'
         OR archivo_denuncia_url ILIKE '%web.s1mple.cloud/s1mple-cloud%'
         OR archivo_denuncia_url ILIKE '%s1mple-cloud.web.s1mple.cloud%'
         OR EXISTS (
           SELECT 1 FROM unnest(adjuntos_urls) url 
           WHERE url ILIKE '%s3.s1mple.cloud/s1mple-cloud%'
              OR url ILIKE '%web.s1mple.cloud/s1mple-cloud%'
              OR url ILIKE '%s1mple-cloud.web.s1mple.cloud%'
         )
    `;

    const result = await pool.query(query);

    console.log(`📊 Encontradas ${result.rows.length} denuncias que requieren migración al formato web directo.\n`);

    let updatedCount = 0;

    for (const row of result.rows) {
      let updatedArchivoUrl = row.archivo_denuncia_url;
      let updatedAdjuntosUrls = row.adjuntos_urls ? [...row.adjuntos_urls] : [];
      let needsUpdate = false;

      // Helper para convertir los diferentes formatos al definitivo (https://web.s1mple.cloud/...)
      const toWebUrl = (urlStr) => {
        if (!urlStr) return urlStr;
        let newUrl = urlStr;
        
        // 1. Reemplazar s3.s1mple.cloud/s1mple-cloud/ -> web.s1mple.cloud/
        newUrl = newUrl.replace('https://s3.s1mple.cloud/s1mple-cloud/', `${targetWebUrl}/`);
        newUrl = newUrl.replace('http://s3.s1mple.cloud/s1mple-cloud/', `${targetWebUrl}/`);
        
        // 2. Reemplazar web.s1mple.cloud/s1mple-cloud/ -> web.s1mple.cloud/
        newUrl = newUrl.replace('https://web.s1mple.cloud/s1mple-cloud/', `${targetWebUrl}/`);
        newUrl = newUrl.replace('http://web.s1mple.cloud/s1mple-cloud/', `${targetWebUrl}/`);
        
        // 3. Reemplazar s1mple-cloud.web.s1mple.cloud/ -> web.s1mple.cloud/
        newUrl = newUrl.replace('https://s1mple-cloud.web.s1mple.cloud/', `${targetWebUrl}/`);
        newUrl = newUrl.replace('http://s1mple-cloud.web.s1mple.cloud/', `${targetWebUrl}/`);
        
        return newUrl;
      };

      // Actualizar archivo principal
      if (row.archivo_denuncia_url) {
        const newUrl = toWebUrl(row.archivo_denuncia_url);
        if (newUrl !== row.archivo_denuncia_url) {
          console.log(`🔹 [Denuncia ${row.id}] Archivo principal:`);
          console.log(`   ❌ Viejo: ${row.archivo_denuncia_url}`);
          console.log(`   ✅ Nuevo: ${newUrl}`);
          updatedArchivoUrl = newUrl;
          needsUpdate = true;
        }
      }

      // Actualizar adjuntos
      if (row.adjuntos_urls && row.adjuntos_urls.length > 0) {
        for (let i = 0; i < row.adjuntos_urls.length; i++) {
          const urlStr = row.adjuntos_urls[i];
          if (urlStr) {
            const newUrl = toWebUrl(urlStr);
            if (newUrl !== urlStr) {
              console.log(`🔹 [Denuncia ${row.id}] Adjunto [${i}]:`);
              console.log(`   ❌ Viejo: ${urlStr}`);
              console.log(`   ✅ Nuevo: ${newUrl}`);
              updatedAdjuntosUrls[i] = newUrl;
              needsUpdate = true;
            }
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
