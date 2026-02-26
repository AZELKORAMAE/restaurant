import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const order = await Order.findByIdAndUpdate(id, { status: body.status }, { new: true });
        if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
