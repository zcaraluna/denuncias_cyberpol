
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName } from '@/lib/s3';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    try {
        const arrayBuffer = await request.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uniqueId = Date.now();
        const key = `denuncias_cyberpol/adjuntos/${uniqueId}-${filename}`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: buffer,
                ContentType: request.headers.get('content-type') || 'application/octet-stream',
            })
        );

        const publicEndpoint = process.env.GARAGE_PUBLIC_URL || 'https://web.s1mple.cloud';
        let url;
        try {
            const urlObj = new URL(publicEndpoint);
            if (!urlObj.hostname.startsWith(`${bucketName}.`)) {
                urlObj.hostname = `${bucketName}.${urlObj.hostname}`;
            }
            url = `${urlObj.origin}/${key}`;
        } catch (e) {
            url = `${publicEndpoint}/${bucketName}/${key}`;
        }

        return NextResponse.json({
            url,
            pathname: key,
        });
    } catch (error) {
        console.error('Error uploading adjunto to Garage S3:', error);
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
}


