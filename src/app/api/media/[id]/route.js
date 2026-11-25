import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Media from '@/models/Media';
import { findFile } from '@/lib/gridfs';

const HEADERS = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    // 3D viewers (Scene Viewer, Quick Look) fetch models cross-origin.
    'Access-Control-Allow-Origin': '*',
};

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) return new NextResponse('Not found', { status: 404 });

        // New files live in GridFS (no 16 MB limit, needed for 3D scans).
        const found = await findFile(id);
        if (found) {
            const { bucket, file } = found;
            const stream = bucket.openDownloadStream(file._id);
            const body = new ReadableStream({
                start(controller) {
                    stream.on('data', (c) => controller.enqueue(new Uint8Array(c)));
                    stream.on('end', () => controller.close());
                    stream.on('error', (e) => controller.error(e));
                },
                cancel() { stream.destroy(); },
            });
            return new NextResponse(body, {
                headers: {
                    ...HEADERS,
                    'Content-Type': file.metadata?.contentType || 'application/octet-stream',
                    'Content-Length': String(file.length),
                },
            });
        }

        // Legacy uploads stored inline in the "media" collection.
        const media = await Media.findById(id);
        if (!media) return new NextResponse('Not found', { status: 404 });
        return new NextResponse(media.data, { headers: { ...HEADERS, 'Content-Type': media.contentType } });
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
