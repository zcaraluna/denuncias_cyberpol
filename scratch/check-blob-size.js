const { list } = require('@vercel/blob');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error("❌ Error: BLOB_READ_WRITE_TOKEN no está definido en .env.local.");
  console.log("\nPor favor, añade tu token a tu archivo .env.local:");
  console.log('BLOB_READ_WRITE_TOKEN="prj_xxxxxxxxxxxxxxxxxxxxxxxx"');
  process.exit(1);
}

async function checkSize() {
  let hasMore = true;
  let cursor = undefined;
  let totalSize = 0;
  let fileCount = 0;

  console.log("🔍 Obteniendo lista de archivos desde Vercel Blob...");

  try {
    while (hasMore) {
      const response = await list({
        cursor,
        token,
      });

      for (const blob of response.blobs) {
        totalSize += blob.size;
        fileCount++;
      }

      hasMore = response.hasMore;
      cursor = response.cursor;
    }

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(4);

    console.log(`\n📊 Resumen de Vercel Blob:`);
    console.log(`-----------------------------------`);
    console.log(`📂 Total de archivos : ${fileCount}`);
    console.log(`💾 Tamaño total      : ${totalSizeMB} MB (${totalSizeGB} GB)`);
    console.log(`📦 Bytes totales     : ${totalSize} bytes`);
    console.log(`-----------------------------------`);

  } catch (error) {
    console.error("❌ Error al consultar Vercel Blob:", error.message);
  }
}

checkSize();
