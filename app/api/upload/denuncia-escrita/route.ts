
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Use the request body directly as the file stream
    // We expect the client to send the file in the body
    if (!request.body) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    try {
        const blob = await put(filename, request.body, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN, // Explicitly using the token requested by user
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Error uploading blob:', error);
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
}
