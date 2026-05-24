import { S3Client } from '@aws-sdk/client-s3';

const endpoint = process.env.GARAGE_ENDPOINT || 'https://s3.s1mple.cloud';
const accessKeyId = process.env.GARAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.GARAGE_SECRET_ACCESS_KEY;
const region = process.env.GARAGE_REGION || 'garage';

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
  forcePathStyle: true, // Requerido por Garage y MinIO
});

export const bucketName = process.env.GARAGE_BUCKET_NAME || 's1mple-cloud';
