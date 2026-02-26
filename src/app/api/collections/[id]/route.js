import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Collection from '@/models/Collection';

export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const collection = await Collection.findByIdAndUpdate(id, body, { new: true });
        if (!collection) return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: collection });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const collection = await Collection.findByIdAndDelete(id);
        if (!collection) return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Collection deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
