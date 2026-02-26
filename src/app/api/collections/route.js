import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Collection from '@/models/Collection';

export async function GET() {
    try {
        await dbConnect();
        const collections = await Collection.find({ isActive: true });
        return NextResponse.json({ success: true, data: collections });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const collection = await Collection.create(body);
        return NextResponse.json({ success: true, data: collection }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
