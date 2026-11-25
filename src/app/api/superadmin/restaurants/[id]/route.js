import { handler, ok, requireSuperAdmin, assertId, HttpError } from '@/lib/api';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

const TRANSITIONS = {
    approve: { from: ['pending', 'rejected', 'suspended'], to: 'approved' },
    reject: { from: ['pending'], to: 'rejected' },
    suspend: { from: ['approved'], to: 'suspended' },
};

// Approve / reject / suspend a restaurant request. The owner's account follows the restaurant.
export const PATCH = handler(async (request, { params }) => {
    await requireSuperAdmin();
    const { id } = await params;
    assertId(id);
    const { action, note } = await request.json();
    const t = TRANSITIONS[action];
    if (!t) throw new HttpError(400, 'Action inconnue.');

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) throw new HttpError(404, 'Restaurant introuvable.');
    if (!t.from.includes(restaurant.status)) throw new HttpError(409, `Impossible depuis le statut « ${restaurant.status} ».`);

    restaurant.status = t.to;
    restaurant.reviewNote = note ? String(note).slice(0, 500) : undefined;
    restaurant.reviewedAt = new Date();
    await restaurant.save();
    if (restaurant.owner) await User.updateOne({ _id: restaurant.owner }, { status: t.to });
    return ok(restaurant);
});

export const DELETE = handler(async (request, { params }) => {
    await requireSuperAdmin();
    const { id } = await params;
    assertId(id);
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) throw new HttpError(404, 'Restaurant introuvable.');
    if (restaurant.status === 'approved') throw new HttpError(409, 'Suspendez le restaurant avant de supprimer la demande.');
    await User.deleteOne({ _id: restaurant.owner });
    await restaurant.deleteOne();
    return ok({ deleted: id });
});
