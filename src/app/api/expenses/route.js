import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";

export async function GET() {
    await dbConnect();
    try {
        const expenses = await Expense.find({}).sort({ date: -1 });
        return NextResponse.json({ success: true, data: expenses });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const expense = await Expense.create(body);
        return NextResponse.json({ success: true, data: expense });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
