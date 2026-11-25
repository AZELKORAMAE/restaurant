import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export const ok = (data, status = 200) => NextResponse.json({ success: true, data }, { status });

/** Wraps a route handler: connects to the DB and turns thrown errors into JSON responses. */
export function handler(fn) {
    return async (request, ctx) => {
        try {
            await dbConnect();
            return await fn(request, ctx);
        } catch (error) {
            const status = error instanceof HttpError ? error.status
                : error?.name === 'ValidationError' || error?.name === 'CastError' ? 400
                    : error?.code === 11000 ? 409 : 500;
            if (status === 500) console.error(error);
            const message = error?.code === 11000 ? 'Cet élément existe déjà.' : error.message;
            return NextResponse.json({ success: false, error: message }, { status });
        }
    };
}

/** Returns the signed-in manager and their restaurant, re-checked against the database on every call. */
export async function requireManager() {
    const session = await auth();
    const sUser = session?.user;
    if (!sUser || sUser.role !== 'manager') throw new HttpError(401, 'Authentification requise.');
    const user = await User.findById(sUser.id);
    if (!user || user.status !== 'approved' || !user.restaurant) {
        throw new HttpError(403, "Votre compte n'est pas (ou plus) validé.");
    }
    const restaurant = await Restaurant.findById(user.restaurant);
    if (!restaurant || restaurant.status !== 'approved') throw new HttpError(403, 'Restaurant non validé.');
    return { user, restaurant, restaurantId: restaurant._id };
}

export async function requireSuperAdmin() {
    const session = await auth();
    if (session?.user?.role !== 'superadmin') throw new HttpError(401, 'Accès réservé à l’administrateur.');
    return session.user;
}

/** Any signed-in, approved account (manager or super-admin). Used for uploads. */
export async function requireAccount() {
    const session = await auth();
    if (session?.user?.role === 'superadmin') return { id: 'superadmin' };
    const { user } = await requireManager();
    return { id: user._id.toString() };
}

/** Finds a public (approved) restaurant by slug or id. */
export async function findPublicRestaurant(ref) {
    if (!ref) throw new HttpError(400, 'Restaurant manquant.');
    const query = mongoose.isValidObjectId(ref) ? { _id: ref } : { slug: String(ref).toLowerCase() };
    const restaurant = await Restaurant.findOne({ ...query, status: 'approved' });
    if (!restaurant) throw new HttpError(404, 'Restaurant introuvable.');
    return restaurant;
}

/** Strips fields a client must never set directly. */
export function sanitize(body, extraForbidden = []) {
    const clean = { ...(body || {}) };
    for (const key of ['_id', '__v', 'restaurant', 'createdAt', 'updatedAt', ...extraForbidden]) delete clean[key];
    return clean;
}

export function assertId(id) {
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Identifiant invalide.');
}
