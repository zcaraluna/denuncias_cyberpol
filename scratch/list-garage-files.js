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
  forcePathStyle: true, // Requerido para Garage/MinIO/s3 local
});

// Ruta al directorio de artefactos (pasada por variable de entorno o calculada)
const artifactDir = 'C:\\Users\\recal\\.gemini\\antigravity-ide\\brain\\f45af563-dcee-4236-a98e-247b0c97e348';
const localScratchDir = path.join(__dirname, '../scratch');

async function listFiles() {
  console.log(`🔌 Conectando a Garage en: ${endpoint}`);
  console.log(`🪣 Usando el bucket: ${bucketName}\n`);

  try {
    let hasMore = true;
    let continuationToken = undefined;
    let fileCount = 0;
    let totalSize = 0;
    const files = [];

    while (hasMore) {
      const response = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
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
          totalSize += item.Size;
          fileCount++;
        }
      }

      hasMore = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }

    if (files.length > 0) {
      // 1. Agrupar por prefijos principales (carpetas) para generar un resumen
      const folders = {};
      files.forEach(file => {
        const parts = file.key.split('/');
        const folderName = parts.length > 1 ? parts[0] : 'root';
        if (!folders[folderName]) {
          folders[folderName] = { count: 0, size: 0 };
        }
        folders[folderName].count++;
        folders[folderName].size += file.size;
      });

      // 2. Generar el contenido markdown
      const dateStr = new Date().toLocaleString();
      let md = `# Listado de Archivos en Garage S3\n\n`;
      md += `Generado el: **${dateStr}**\n`;
      md += `Endpoint: \`${endpoint}\`\n`;
      md += `Bucket: \`${bucketName}\`\n\n`;
      
      md += `## Resumen por Carpeta / Prefijo\n\n`;
      md += `| Carpeta / Prefijo | Cantidad de Archivos | Tamaño Total (MB) | Tamaño Total (Bytes) |\n`;
      md += `| :--- | :---: | :---: | :---: |\n`;
      
      Object.keys(folders).sort().forEach(folder => {
        const f = folders[folder];
        md += `| **${folder}** | ${f.count} | ${(f.size / (1024 * 1024)).toFixed(2)} MB | ${f.size.toLocaleString()} | \n`;
      });
      
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      md += `| **TOTAL** | **${fileCount}** | **${totalSizeMB} MB** | **${totalSize.toLocaleString()}** |\n\n`;

      md += `## Listado Detallado de Archivos\n\n`;
      md += `| Archivo (Key) | Tamaño | Fecha de Modificación |\n`;
      md += `| :--- | :---: | :--- |\n`;
      
      files.forEach(file => {
        const sizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
          : `${(file.size / 1024).toFixed(2)} KB`;
        md += `| \`${file.key}\` | ${sizeStr} | ${new Date(file.lastModified).toISOString()} |\n`;
      });

      // Escribir el archivo markdown en el scratch local
      const localMdPath = path.join(localScratchDir, 'garage_files_list.md');
      fs.writeFileSync(localMdPath, md, 'utf8');
      console.log(`✅ Archivo markdown escrito localmente en: ${localMdPath}`);

      // Escribir el archivo markdown en la carpeta de artefactos
      try {
        if (!fs.existsSync(artifactDir)) {
          fs.mkdirSync(artifactDir, { recursive: true });
        }
        const artifactMdPath = path.join(artifactDir, 'garage_files_list.md');
        fs.writeFileSync(artifactMdPath, md, 'utf8');
        console.log(`✅ Archivo markdown escrito en artefactos en: ${artifactMdPath}`);
      } catch (err) {
        console.warn(`⚠️ No se pudo escribir en el directorio de artefactos directamente:`, err.message);
      }

      // También escribir resumen JSON en el scratch local para lectura fácil
      const summaryJson = {
        totalFiles: fileCount,
        totalSizeBytes: totalSize,
        totalSizeMB: parseFloat(totalSizeMB),
        folders: folders
      };
      fs.writeFileSync(path.join(localScratchDir, 'garage_summary.json'), JSON.stringify(summaryJson, null, 2), 'utf8');
      
    } else {
      console.log('ℹ️ El bucket está vacío.');
    }
  } catch (error) {
    console.error('❌ Ocurrió un error al intentar listar los archivos en Garage:');
    console.error(error.message || error);
  }
}

listFiles();
