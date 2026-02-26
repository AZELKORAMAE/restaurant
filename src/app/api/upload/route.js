import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Media from '@/models/Media';

export async function POST(request) {
    try {
        await dbConnect();
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Store in MongoDB
        const media = await Media.create({
            filename: file.name,
            contentType: file.type,
            data: buffer
        });

        // The URL will now point to our new media serving endpoint
        return NextResponse.json({
            success: true,
            url: `/api/media/${media._id}`
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
