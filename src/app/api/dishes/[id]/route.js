import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Dish from '@/models/Dish';

export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const dish = await Dish.findByIdAndUpdate(id, body, { new: true });
        if (!dish) return NextResponse.json({ success: false, error: 'Dish not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: dish });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const dish = await Dish.findByIdAndDelete(id);
        if (!dish) return NextResponse.json({ success: false, error: 'Dish not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Dish deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
