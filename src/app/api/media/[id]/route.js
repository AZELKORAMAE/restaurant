import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Media from '@/models/Media';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const media = await Media.findById(id);

        if (!media) {
            return new NextResponse('Image not found', { status: 404 });
        }

        return new NextResponse(media.data, {
            headers: {
                'Content-Type': media.contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
