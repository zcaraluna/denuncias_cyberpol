const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Obtener credenciales de variables de entorno
const endpoint = process.env.GARAGE_ENDPOINT || 'https://s3.s1mple.cloud';
const accessKeyId = process.env.GARAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.GARAGE_SECRET_ACCESS_KEY;
const bucketName = process.env.GARAGE_BUCKET_NAME || 's1mple-cloud';
const region = process.env.GARAGE_REGION || 'garage';

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ Error: Falta configurar GARAGE_ACCESS_KEY_ID o GARAGE_SECRET_ACCESS_KEY en el .env.local');
  process.exit(1);
}

// Inicializar el cliente S3 para Garage
const s3 = new S3Client({
  endpoint: endpoint,
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: true,
});

const targetPrefix = 'denuncias_cyberpol/';

async function listDenunciasFiles() {
  console.log(`🔌 Conectando a Garage en: ${endpoint}`);
  console.log(`🪣 Usando el bucket: ${bucketName}`);
  console.log(`🔍 Filtrando por prefijo: ${targetPrefix}\n`);

  try {
    let hasMore = true;
    let continuationToken = undefined;
    const files = [];

    while (hasMore) {
      const response = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: targetPrefix,
          ContinuationToken: continuationToken,
        })
      );

      if (response.Contents && response.Contents.length > 0) {
        for (const item of response.Contents) {
          files.push({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
          });
        }
      }

      hasMore = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }

    if (files.length > 0) {
      console.log(`✅ Archivos encontrados: ${files.length}\n`);
      
      // Imprimir la tabla directamente en la consola para que el agente la vea
      console.log('| Archivo (Key) | Tamaño | Fecha de Modificación |');
      console.log('| :--- | :---: | :--- |');
      files.forEach(f => {
        const sizeStr = f.size > 1024 * 1024 
          ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` 
          : `${(f.size / 1024).toFixed(2)} KB`;
        console.log(`| ${f.key} | ${sizeStr} | ${f.lastModified.toISOString()} |`);
      });

      // Escribir listado en archivo markdown local
      const localMdPath = path.join(__dirname, '../scratch/denuncias_files_list.md');
      let md = `# Archivos del Proyecto Denuncias en Garage S3\n\n`;
      md += `Generado el: **${new Date().toLocaleString()}**\n`;
      md += `Prefijo: \`${targetPrefix}\`\n\n`;
      md += `| Archivo (Key) | Tamaño | Fecha de Modificación |\n`;
      md += `| :--- | :---: | :--- |\n`;
      files.forEach(f => {
        const sizeStr = f.size > 1024 * 1024 
          ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` 
          : `${(f.size / 1024).toFixed(2)} KB`;
        md += `| \`${f.key}\` | ${sizeStr} | ${f.lastModified.toISOString()} |\n`;
      });
      fs.writeFileSync(localMdPath, md, 'utf8');
      console.log(`\n💾 Archivo guardado localmente en: ${localMdPath}`);
    } else {
      console.log('ℹ️ No se encontraron archivos para el prefijo denuncias_cyberpol/.');
    }
  } catch (error) {
    console.error('❌ Error al listar los archivos:', error.message || error);
  }
}

listDenunciasFiles();
