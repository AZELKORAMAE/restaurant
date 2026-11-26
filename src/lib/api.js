import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import { getSettings, accessFor } from '@/lib/subscription';

export const ACT_AS_COOKIE = 'sa_restaurant';

export class HttpError extends Error {
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code;
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
            return NextResponse.json({ success: false, error: message, code: error?.code && typeof error.code === 'string' ? error.code : undefined }, { status });
        }
    };
}

const MESSAGES = {
    expired: 'Votre abonnement a expiré. Renouvelez-le dans l’onglet Abonnement pour continuer.',
    readOnly: 'L’administrateur a passé votre compte en lecture seule.',
};

/**
 * Returns the restaurant being managed and what it may do.
 * - A manager manages their own restaurant (re-checked in the database on every call).
 * - The super-admin can manage any restaurant ("Gérer" in the admin space), with full rights.
 * Options: write → the call changes data (blocked when expired / read-only).
 */
export async function requireManager({ write = false } = {}) {
    const session = await auth();
    const sUser = session?.user;
    const settings = await getSettings();

    if (sUser?.role === 'superadmin') {
        const id = (await cookies()).get(ACT_AS_COOKIE)?.value;
        const restaurant = id && mongoose.isValidObjectId(id) ? await Restaurant.findById(id) : null;
        if (!restaurant) throw new HttpError(400, 'Choisissez d’abord un restaurant à gérer depuis l’administration.');
        const access = { ...accessFor(restaurant, settings), canEdit: true, can3d: true, canAutoScan: true, maxDishes: null, max3d: null };
        return { user: { _id: 'superadmin', name: 'Administrateur' }, restaurant, restaurantId: restaurant._id, access, settings, actingAdmin: true };
    }

    if (!sUser || sUser.role !== 'manager') throw new HttpError(401, 'Authentification requise.');
    const user = await User.findById(sUser.id);
    if (!user || user.status !== 'approved' || !user.restaurant) {
        throw new HttpError(403, "Votre compte n'est pas (ou plus) validé.");
    }
    const restaurant = await Restaurant.findById(user.restaurant);
    if (!restaurant || restaurant.status !== 'approved') throw new HttpError(403, 'Restaurant non validé.');

    const access = accessFor(restaurant, settings);
    if (write && !access.canEdit) {
        const expired = !access.live;
        throw new HttpError(402, expired ? MESSAGES.expired : MESSAGES.readOnly, expired ? 'subscription_expired' : 'read_only');
    }
    return { user, restaurant, restaurantId: restaurant._id, access, settings, actingAdmin: false };
}

export async function requireSuperAdmin() {
    const session = await auth();
    if (session?.user?.role !== 'superadmin') throw new HttpError(401, 'Accès réservé à l’administrateur.');
    return session.user;
}

/** Any signed-in, approved account (manager or super-admin). Used for uploads (also payment receipts). */
export async function requireAccount() {
    const session = await auth();
    if (session?.user?.role === 'superadmin') return { id: 'superadmin' };
    const { user } = await requireManager();
    return { id: user._id.toString() };
}

/** Finds a public restaurant by slug or id: approved and with a live subscription. */
export async function findPublicRestaurant(ref) {
    if (!ref) throw new HttpError(400, 'Restaurant manquant.');
    const query = mongoose.isValidObjectId(ref) ? { _id: ref } : { slug: String(ref).toLowerCase() };
    const restaurant = await Restaurant.findOne({ ...query, status: 'approved' });
    if (!restaurant) throw new HttpError(404, 'Restaurant introuvable.');
    const access = accessFor(restaurant, await getSettings());
    if (!access.live) throw new HttpError(404, 'Ce menu est temporairement indisponible.', 'unavailable');
    return { restaurant, access };
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

/** Public origin of the site (for links sent to managers). */
export function siteOrigin(request) {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    const h = request.headers;
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
}
