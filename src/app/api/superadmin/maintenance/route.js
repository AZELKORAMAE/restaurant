import { handler, ok, requireSuperAdmin, assertId, HttpError } from '@/lib/api';
import Restaurant from '@/models/Restaurant';
import Collection from '@/models/Collection';
import Supplement from '@/models/Supplement';
import Table from '@/models/Table';
import Dish from '@/models/Dish';
import Order from '@/models/Order';
import Expense from '@/models/Expense';
import User from '@/models/User';

const MODELS = { Collection, Supplement, Table, Dish, Order, Expense };

/**
 * Migration helper for data created before the multi-restaurant platform:
 *   { action: "assign-orphans", restaurantId }  attaches every document without restaurant to it,
 *   then rebuilds indexes;
 *   { action: "sync-indexes" } only rebuilds indexes.
 *   Rebuilding (old global "unique name" indexes become per-restaurant).
 */
export const POST = handler(async (request) => {
    await requireSuperAdmin();
    const { action, restaurantId } = await request.json();
    if (action === 'sync-indexes') {
        for (const Model of [...Object.values(MODELS), Restaurant, User]) await Model.syncIndexes();
        return ok({ synced: true });
    }
    if (action !== 'assign-orphans') throw new HttpError(400, 'Action inconnue.');
    assertId(restaurantId);
    if (!(await Restaurant.exists({ _id: restaurantId }))) throw new HttpError(404, 'Restaurant introuvable.');

    const result = {};
    for (const [name, Model] of Object.entries(MODELS)) {
        const r = await Model.updateMany({ restaurant: { $exists: false } }, { $set: { restaurant: restaurantId } });
        const r2 = await Model.updateMany({ restaurant: null }, { $set: { restaurant: restaurantId } });
        result[name] = r.modifiedCount + r2.modifiedCount;
    }
    for (const Model of [...Object.values(MODELS), Restaurant, User]) await Model.syncIndexes();
    return ok(result);
});
