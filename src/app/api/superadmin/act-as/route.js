import { NextResponse } from 'next/server';
import { handler, requireSuperAdmin, assertId, ACT_AS_COOKIE, HttpError } from '@/lib/api';
import Restaurant from '@/models/Restaurant';

// The super-admin opens a restaurant's dashboard (same interface as its manager).
export const POST = handler(async (request) => {
    await requireSuperAdmin();
    const { restaurantId } = await request.json();
    assertId(restaurantId);
    if (!(await Restaurant.exists({ _id: restaurantId }))) throw new HttpError(404, 'Restaurant introuvable.');
    const res = NextResponse.json({ success: true, data: { restaurantId } });
    res.cookies.set(ACT_AS_COOKIE, restaurantId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12 });
    return res;
});

export const DELETE = handler(async () => {
    const res = NextResponse.json({ success: true, data: null });
    res.cookies.delete(ACT_AS_COOKIE);
    return res;
});
