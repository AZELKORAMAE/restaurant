import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        // body should contain items, totalAmount, customerInfo
        const order = await Order.create(body);
        return NextResponse.json({ success: true, data: order }, { status: 201 });
    } catch (error) {
        console.error("Order POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function GET() {
    try {
        await dbConnect();
        const orders = await Order.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
