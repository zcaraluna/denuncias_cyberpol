const { S3Client, GetBucketWebsiteCommand, GetBucketPolicyCommand, GetBucketAclCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const endpoint = process.env.GARAGE_ENDPOINT || 'https://s3.s1mple.cloud';
const accessKeyId = process.env.GARAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.GARAGE_SECRET_ACCESS_KEY;
const bucketName = process.env.GARAGE_BUCKET_NAME || 's1mple-cloud';
const region = process.env.GARAGE_REGION || 'garage';

const s3 = new S3Client({
  endpoint: endpoint,
  region: region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

async function main() {
  console.log(`🔍 Consultando configuración del bucket: ${bucketName}...\n`);
  
  // 1. Obtener Website
  try {
    const website = await s3.send(new GetBucketWebsiteCommand({ Bucket: bucketName }));
    console.log("✅ Configuración de Website:");
    console.log(JSON.stringify(website, null, 2));
  } catch (err) {
    console.log("❌ Error/No configurado como Website:", err.message);
  }
  
  console.log("\n----------------------------------------\n");

  // 2. Obtener ACL
  try {
    const acl = await s3.send(new GetBucketAclCommand({ Bucket: bucketName }));
    console.log("✅ ACL del Bucket:");
    console.log(JSON.stringify(acl, null, 2));
  } catch (err) {
    console.log("❌ Error al obtener ACL:", err.message);
  }

  console.log("\n----------------------------------------\n");

  // 3. Obtener Policy
  try {
    const policy = await s3.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
    console.log("✅ Política del Bucket:");
    console.log(JSON.stringify(JSON.parse(policy.Policy), null, 2));
  } catch (err) {
    console.log("❌ Error/No tiene Política pública asignada:", err.message);
  }
}

main();
