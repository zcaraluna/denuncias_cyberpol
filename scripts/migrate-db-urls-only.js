const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Obtener credenciales
const garageEndpoint = process.env.GARAGE_PUBLIC_URL || 'https://web.s1mple.cloud';
const bucketName = process.env.GARAGE_BUCKET_NAME || 's1mple-cloud';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

function convertVercelToGarage(urlStr) {
  if (!urlStr) return null;
  if (!urlStr.includes('vercel-storage.com')) return urlStr; // No modificar si no es de Vercel

  try {
    const url = new URL(urlStr);
    let pathname = decodeURIComponent(url.pathname);
    
    if (pathname.startsWith('/')) {
      pathname = pathname.substring(1);
    }
    
    // El pathname en Vercel suele ser "adjuntos/filename.ext" o "filename.ext"
    const isAdjunto = pathname.startsWith('adjuntos/');
    const filename = isAdjunto ? pathname.substring('adjuntos/'.length) : pathname;
    
    // Generar la nueva URL apuntando a Garage S3
    const newUrl = isAdjunto
      ? `${garageEndpoint}/${bucketName}/denuncias_cyberpol/adjuntos/${encodeURIComponent(filename)}`
      : `${garageEndpoint}/${bucketName}/denuncias_cyberpol/denuncias-escritas/${encodeURIComponent(filename)}`;
      
    return newUrl;
  } catch (err) {
    console.error(`⚠️ Error al parsear URL "${urlStr}":`, err.message);
    return urlStr;
  }
}

async function runMigration() {
  console.log("🚀 Iniciando migración de URLs de Vercel a Garage S3 en la base de datos...");
  console.log(`📡 Base de datos destino: ${process.env.DATABASE_URL.split('@')[1] || 'URL interna'}`);
  console.log(`📡 Endpoint de Garage: ${garageEndpoint}`);
  console.log(`🪣 Bucket: ${bucketName}\n`);

  try {
    // 1. Obtener todas las denuncias con enlaces de Vercel
    const result = await pool.query(
      `SELECT id, archivo_denuncia_url, adjuntos_urls 
       FROM denuncias 
       WHERE archivo_denuncia_url ILIKE '%vercel-storage.com%'
          OR EXISTS (
            SELECT 1 FROM unnest(adjuntos_urls) url WHERE url ILIKE '%vercel-storage.com%'
          )`
    );

    console.log(`📊 Encontradas ${result.rows.length} denuncias que requieren actualización.\n`);

    let updatedRows = 0;

    for (const row of result.rows) {
      let updatedArchivoUrl = row.archivo_denuncia_url;
      let updatedAdjuntosUrls = row.adjuntos_urls ? [...row.adjuntos_urls] : [];
      let needsUpdate = false;

      // Actualizar archivo principal si es de Vercel
      if (row.archivo_denuncia_url && row.archivo_denuncia_url.includes('vercel-storage.com')) {
        const newUrl = convertVercelToGarage(row.archivo_denuncia_url);
        if (newUrl !== row.archivo_denuncia_url) {
          console.log(`🔹 [Denuncia ${row.id}] Actualizando archivo principal:`);
          console.log(`   ❌ Viejo: ${row.archivo_denuncia_url}`);
          console.log(`   ✅ Nuevo: ${newUrl}`);
          updatedArchivoUrl = newUrl;
          needsUpdate = true;
        }
      }

      // Actualizar adjuntos si son de Vercel
      if (row.adjuntos_urls && row.adjuntos_urls.length > 0) {
        for (let i = 0; i < row.adjuntos_urls.length; i++) {
          const urlStr = row.adjuntos_urls[i];
          if (urlStr && urlStr.includes('vercel-storage.com')) {
            const newUrl = convertVercelToGarage(urlStr);
            if (newUrl !== urlStr) {
              console.log(`🔹 [Denuncia ${row.id}] Actualizando adjunto [${i}]:`);
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
        updatedRows++;
        console.log(`   💾 Guardado en base de datos.\n`);
      }
    }

    console.log(`===================================================================`);
    console.log(`🏁 Proceso Finalizado`);
    console.log(`- Registros actualizados con éxito: ${updatedRows}`);
    console.log(`===================================================================`);

  } catch (error) {
    console.error("❌ Error crítico durante la migración de base de datos:", error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
