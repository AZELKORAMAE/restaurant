import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Dish from '@/models/Dish';
import Collection from '@/models/Collection'; // Ensure model is registered
import Supplement from '@/models/Supplement'; // Ensure model is registered

export async function GET() {
    try {
        await dbConnect();
        const dishes = await Dish.find({ isActive: true })
            .populate('collection')
            .populate('supplements');
        return NextResponse.json({ success: true, data: dishes });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        console.log("API POST Body:", body);
        console.log("Dish Schema Paths:", Object.keys(Dish.schema.paths));
        const dish = await Dish.create(body);
        return NextResponse.json({ success: true, data: dish }, { status: 201 });
    } catch (error) {
        console.error("API Dish POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
