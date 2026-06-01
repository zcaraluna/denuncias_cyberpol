const { Pool } = require('pg');
const { S3Client, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 1. Configurar Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// 2. Configurar cliente S3 para Garage
const garageEndpoint = process.env.GARAGE_ENDPOINT || 'https://s3.s1mple.cloud';
const garageAccessKey = process.env.GARAGE_ACCESS_KEY_ID;
const garageSecretKey = process.env.GARAGE_SECRET_ACCESS_KEY;
const bucketName = process.env.GARAGE_BUCKET_NAME || 's1mple-cloud';
const region = process.env.GARAGE_REGION || 'garage';

const s3Client = new S3Client({
  endpoint: garageEndpoint,
  region: region,
  credentials: {
    accessKeyId: garageAccessKey,
    secretAccessKey: garageSecretKey,
  },
  forcePathStyle: true,
});

// Helper para extraer información de los URLs antiguos
function getFileInfo(urlStr) {
  if (!urlStr) return null;
  
  try {
    const url = new URL(urlStr);
    let pathname = decodeURIComponent(url.pathname);
    
    // Si la URL es de S3 local, incluye el bucket en el path
    if (pathname.startsWith(`/${bucketName}/`)) {
      pathname = pathname.substring(`/${bucketName}/`.length);
    } else if (pathname.startsWith('/')) {
      pathname = pathname.substring(1);
    }
    
    // Ahora pathname es como "adjuntos/file.jpg" o "file.pdf"
    const isAdjunto = pathname.startsWith('adjuntos/');
    const filename = isAdjunto ? pathname.substring('adjuntos/'.length) : pathname;
    
    const oldKey = pathname;
    const newKey = isAdjunto 
      ? `denuncias_cyberpol/adjuntos/${filename}` 
      : `denuncias_cyberpol/denuncias-escritas/${filename}`;
      
    const newUrl = isAdjunto
      ? `${garageEndpoint}/${bucketName}/denuncias_cyberpol/adjuntos/${encodeURIComponent(filename)}`
      : `${garageEndpoint}/${bucketName}/denuncias_cyberpol/denuncias-escritas/${encodeURIComponent(filename)}`;
      
    return { oldKey, newKey, newUrl, filename, isAdjunto };
  } catch (err) {
    console.error(`⚠️ Error parseando URL "${urlStr}":`, err.message);
    return null;
  }
}

async function verifyS3ObjectExists(key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.warn(`⚠️ Advertencia al verificar existencia de S3 Key "${key}":`, err.message);
    return false;
  }
}

async function runMigration() {
  console.log("🚀 Iniciando migración de rutas e históricos...");
  console.log(`📡 Endpoint de Garage: ${garageEndpoint}`);
  console.log(`🪣 Bucket: ${bucketName}\n`);

  try {
    // 1. Obtener todas las denuncias con archivos o adjuntos
    const result = await pool.query(
      `SELECT id, archivo_denuncia_url, adjuntos_urls 
       FROM denuncias 
       WHERE archivo_denuncia_url IS NOT NULL 
          OR (adjuntos_urls IS NOT NULL AND cardinality(adjuntos_urls) > 0)`
    );

    console.log(`📊 Encontradas ${result.rows.length} denuncias para procesar.\n`);

    let totalMigratedFiles = 0;
    let totalErrors = 0;

    for (const row of result.rows) {
      console.log(`-------------------------------------------------------------------`);
      console.log(`🔹 Procesando Denuncia ID: ${row.id}`);
      
      let updatedArchivoUrl = row.archivo_denuncia_url;
      let updatedAdjuntosUrls = row.adjuntos_urls ? [...row.adjuntos_urls] : [];
      let dbNeedsUpdate = false;

      // --- A. Procesar Denuncia Escrita (Principal) ---
      if (row.archivo_denuncia_url) {
        // Ignorar si ya está en la ruta nueva
        if (row.archivo_denuncia_url.includes('/denuncias_cyberpol/')) {
          console.log(`   ℹ️ El archivo principal ya está migrado: ${row.archivo_denuncia_url}`);
        } else {
          const fileInfo = getFileInfo(row.archivo_denuncia_url);
          if (fileInfo) {
            console.log(`   📄 Archivo principal viejo: "${fileInfo.oldKey}"`);
            console.log(`   ➡️ Copiando a: "${fileInfo.newKey}"...`);

            try {
              // Verificar si el archivo está en S3
              const exists = await verifyS3ObjectExists(fileInfo.oldKey);
              if (exists) {
                // Copiar en S3
                await s3Client.send(new CopyObjectCommand({
                  Bucket: bucketName,
                  CopySource: encodeURI(`/${bucketName}/${fileInfo.oldKey}`),
                  Key: fileInfo.newKey,
                }));
                console.log(`   ✅ Copiado en S3.`);

                // Eliminar el viejo de S3
                await s3Client.send(new DeleteObjectCommand({
                  Bucket: bucketName,
                  Key: fileInfo.oldKey,
                }));
                console.log(`   ✅ Original eliminado de S3.`);
              } else {
                console.warn(`   ⚠️ Advertencia: El archivo "${fileInfo.oldKey}" no existe en S3. Actualizando solo base de datos...`);
              }

              updatedArchivoUrl = fileInfo.newUrl;
              dbNeedsUpdate = true;
              totalMigratedFiles++;
            } catch (err) {
              console.error(`   ❌ Error al migrar archivo principal "${fileInfo.oldKey}":`, err.message);
              totalErrors++;
            }
          }
        }
      }

      // --- B. Procesar Adjuntos Opcionales ---
      if (row.adjuntos_urls && row.adjuntos_urls.length > 0) {
        for (let i = 0; i < row.adjuntos_urls.length; i++) {
          const urlStr = row.adjuntos_urls[i];
          
          // Ignorar si ya está en la ruta nueva
          if (urlStr.includes('/denuncias_cyberpol/')) {
            console.log(`   ℹ️ Adjunto [${i}] ya está migrado: ${urlStr}`);
            continue;
          }

          const fileInfo = getFileInfo(urlStr);
          if (fileInfo) {
            console.log(`   📎 Adjunto viejo: "${fileInfo.oldKey}"`);
            console.log(`   ➡️ Copiando a: "${fileInfo.newKey}"...`);

            try {
              // Verificar si el archivo está en S3
              const exists = await verifyS3ObjectExists(fileInfo.oldKey);
              if (exists) {
                // Copiar en S3
                await s3Client.send(new CopyObjectCommand({
                  Bucket: bucketName,
                  CopySource: encodeURI(`/${bucketName}/${fileInfo.oldKey}`),
                  Key: fileInfo.newKey,
                }));
                console.log(`   ✅ Copiado en S3.`);

                // Eliminar el viejo de S3
                await s3Client.send(new DeleteObjectCommand({
                  Bucket: bucketName,
                  Key: fileInfo.oldKey,
                }));
                console.log(`   ✅ Original eliminado de S3.`);
              } else {
                console.warn(`   ⚠️ Advertencia: El archivo "${fileInfo.oldKey}" no existe en S3. Actualizando solo base de datos...`);
              }

              updatedAdjuntosUrls[i] = fileInfo.newUrl;
              dbNeedsUpdate = true;
              totalMigratedFiles++;
            } catch (err) {
              console.error(`   ❌ Error al migrar adjunto "${fileInfo.oldKey}":`, err.message);
              totalErrors++;
            }
          }
        }
      }

      // --- C. Guardar Cambios en la Base de Datos ---
      if (dbNeedsUpdate) {
        console.log(`   💾 Actualizando registro en base de datos...`);
        await pool.query(
          `UPDATE denuncias 
           SET archivo_denuncia_url = $1, 
               adjuntos_urls = $2 
           WHERE id = $3`,
          [updatedArchivoUrl, updatedAdjuntosUrls, row.id]
        );
        console.log(`   ✅ Registro de base de datos actualizado.`);
      } else {
        console.log(`   ℹ️ No se requirieron cambios en la base de datos.`);
      }
    }

    console.log(`\n===================================================================`);
    console.log(`🏁 Proceso de Reestructuración Finalizado`);
    console.log(`- Archivos procesados y reubicados con éxito: ${totalMigratedFiles}`);
    console.log(`- Errores encontrados                     : ${totalErrors}`);
    console.log(`===================================================================`);

  } catch (error) {
    console.error("❌ Error crítico en el proceso de migración:", error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
