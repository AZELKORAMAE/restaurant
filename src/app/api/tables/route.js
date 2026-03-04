import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Table from '@/models/Table';

export async function GET() {
    try {
        await dbConnect();
        const tables = await Table.find({}).sort({ number: 1 });
        return NextResponse.json({ success: true, data: tables });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const table = await Table.create(body);
        return NextResponse.json({ success: true, data: table }, { status: 201 });
    } catch (error) {
        console.error("Table POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
