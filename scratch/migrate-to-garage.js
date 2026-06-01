const { list } = require('@vercel/blob');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 1. Obtener y validar credenciales de Vercel Blob
const vercelToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!vercelToken) {
  console.error("❌ Error: BLOB_READ_WRITE_TOKEN no está definido en .env.local.");
  process.exit(1);
}

// 2. Obtener y validar credenciales de Garage S3
const garageEndpoint = process.env.GARAGE_ENDPOINT || 'https://s3.s1mple.cloud';
const garageAccessKey = process.env.GARAGE_ACCESS_KEY_ID;
const garageSecretKey = process.env.GARAGE_SECRET_ACCESS_KEY;
const garageBucket = process.env.GARAGE_BUCKET_NAME || 's1mple-cloud';
const garageRegion = process.env.GARAGE_REGION || 'garage';

if (!garageAccessKey || !garageSecretKey) {
  console.error("❌ Error: Falta configurar GARAGE_ACCESS_KEY_ID o GARAGE_SECRET_ACCESS_KEY en el .env.local.");
  process.exit(1);
}

// 3. Inicializar el cliente S3 para Garage
const s3Client = new S3Client({
  endpoint: garageEndpoint,
  region: garageRegion,
  credentials: {
    accessKeyId: garageAccessKey,
    secretAccessKey: garageSecretKey,
  },
  forcePathStyle: true, // Requerido para Garage/MinIO
});

async function runMigration() {
  let hasMore = true;
  let cursor = undefined;
  let successCount = 0;
  let errorCount = 0;

  console.log("🚀 Iniciando migración de Vercel Blob a Garage S3...");
  console.log(`📡 Origen : Vercel Blob`);
  console.log(`📡 Destino: Garage S3 (${garageEndpoint} - Bucket: ${garageBucket})\n`);

  while (hasMore) {
    try {
      // Listar archivos de Vercel Blob (máximo 1000 por página, pero aquí tenemos 52 en total)
      const response = await list({
        cursor,
        token: vercelToken,
      });

      for (const blob of response.blobs) {
        console.log(`📦 Procesando: ${blob.pathname} (${(blob.size / 1024).toFixed(2)} KB)...`);

        try {
          // Descargar archivo desde Vercel
          const fileResponse = await fetch(blob.url);
          if (!fileResponse.ok) {
            throw new Error(`Fallo al descargar de Vercel Blob: ${fileResponse.statusText}`);
          }

          const arrayBuffer = await fileResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Subir a Garage
          await s3Client.send(
            new PutObjectCommand({
              Bucket: garageBucket,
              Key: blob.pathname, // Mantiene la misma ruta/nombre original
              Body: buffer,
              ContentType: fileResponse.headers.get("content-type") || "application/octet-stream",
            })
          );

          successCount++;
          console.log(`   ✅ Migrado correctamente.`);
        } catch (fileError) {
          errorCount++;
          console.error(`   ❌ Error al migrar ${blob.pathname}:`, fileError.message);
        }
      }

      hasMore = response.hasMore;
      cursor = response.cursor;

    } catch (apiError) {
      console.error("❌ Error grave en la API de Vercel Blob:", apiError.message);
      break;
    }
  }

  console.log(`\n🏁 Migración Finalizada`);
  console.log(`-----------------------------------`);
  console.log(`✅ Archivos migrados con éxito: ${successCount}`);
  console.log(`❌ Archivos con error         : ${errorCount}`);
  console.log(`-----------------------------------`);
}

runMigration();
