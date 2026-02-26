import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Supplement from '@/models/Supplement';

export async function GET() {
    try {
        await dbConnect();
        const supplements = await Supplement.find({ isActive: true });
        return NextResponse.json({ success: true, data: supplements });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const supplement = await Supplement.create(body);
        return NextResponse.json({ success: true, data: supplement }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
