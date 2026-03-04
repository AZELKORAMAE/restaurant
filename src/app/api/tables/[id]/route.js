import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Table from '@/models/Table';

export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const table = await Table.findByIdAndUpdate(id, body, { new: true });
        if (!table) {
            return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: table });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const table = await Table.findByIdAndDelete(id);
        if (!table) {
            return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: table });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
