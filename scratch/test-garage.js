const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Obtener credenciales de variables de entorno o usar valores por defecto para pruebas
const endpoint = process.env.GARAGE_ENDPOINT || 'http://localhost:3900';
const accessKeyId = process.env.GARAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.GARAGE_SECRET_ACCESS_KEY;
const bucketName = process.env.GARAGE_BUCKET_NAME || 'test-bucket';
const region = process.env.GARAGE_REGION || 'garage';

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ Error: Falta configurar GARAGE_ACCESS_KEY_ID o GARAGE_SECRET_ACCESS_KEY en el .env.local');
  console.log('Añade esto a tu archivo .env.local:');
  console.log('GARAGE_ENDPOINT="http://TU_IP_O_DOMINIO:PUERTO"');
  console.log('GARAGE_ACCESS_KEY_ID="tu_access_key"');
  console.log('GARAGE_SECRET_ACCESS_KEY="tu_secret_key"');
  console.log('GARAGE_BUCKET_NAME="nombre-de-tu-bucket"');
  console.log('GARAGE_REGION="garage"');
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

async function testConnection() {
  const testKey = 'test-file-' + Date.now() + '.txt';
  const testContent = 'Hola, esta es una prueba de conexión a Garage S3.';

  console.log(`🔌 Conectando a Garage en: ${endpoint}`);
  console.log(`🪣 Usando el bucket: ${bucketName}\n`);

  try {
    // 1. Intentar subir un archivo de prueba
    console.log(`📤 Subiendo archivo de prueba: "${testKey}"...`);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      })
    );
    console.log('✅ Archivo subido con éxito.');

    // 2. Listar archivos del bucket
    console.log('\n📖 Listando archivos en el bucket...');
    const listResponse = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
      })
    );

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log(`✅ Archivos encontrados (${listResponse.Contents.length}):`);
      listResponse.Contents.forEach((item) => {
        console.log(`   - ${item.Key} (${item.Size} bytes)`);
      });
    } else {
      console.log('ℹ️ El bucket está vacío (esto no debería pasar si la subida fue exitosa).');
    }

    // 3. Eliminar archivo de prueba
    console.log(`\n🗑️ Limpiando: eliminando archivo de prueba "${testKey}"...`);
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    console.log('✅ Archivo temporal eliminado.');
    
    console.log('\n🎉 ¡Prueba de conexión a Garage S3 finalizada CON ÉXITO! 🎉');

  } catch (error) {
    console.error('\n❌ Ocurrió un error al intentar conectarse a Garage S3:');
    console.error(error);
  }
}

testConnection();
