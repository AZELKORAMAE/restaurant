import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Supplement from '@/models/Supplement';

export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const supplement = await Supplement.findByIdAndUpdate(id, body, { new: true });
        if (!supplement) return NextResponse.json({ success: false, error: 'Supplement not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: supplement });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const supplement = await Supplement.findByIdAndDelete(id);
        if (!supplement) return NextResponse.json({ success: false, error: 'Supplement not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Supplement deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
