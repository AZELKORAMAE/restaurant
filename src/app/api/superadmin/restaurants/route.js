import { handler, ok, requireSuperAdmin } from '@/lib/api';
import { getSettings, accessFor } from '@/lib/subscription';
import Restaurant from '@/models/Restaurant';
import Dish from '@/models/Dish';
import Order from '@/models/Order';
import Payment from '@/models/Payment';
import '@/models/User';

export const GET = handler(async () => {
    await requireSuperAdmin();
    const settings = await getSettings();
    const restaurants = await Restaurant.find({}).sort({ createdAt: -1 }).populate('owner', 'name email phone status createdAt');
    const [dishCounts, orderCounts, pending] = await Promise.all([
        Dish.aggregate([{ $group: { _id: '$restaurant', n: { $sum: 1 }, n3d: { $sum: { $cond: [{ $eq: ['$model3d.status', 'ready'] }, 1, 0] } } } }]),
        Order.aggregate([{ $group: { _id: '$restaurant', n: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }]),
        Payment.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: '$restaurant', n: { $sum: 1 } } }]),
    ]);
    const byId = (arr) => Object.fromEntries(arr.map((x) => [String(x._id), x]));
    const d = byId(dishCounts), o = byId(orderCounts), p = byId(pending);
    const orphans = (d.null?.n || 0) + (o.null?.n || 0);
    return ok({
        restaurants: restaurants.map((r) => {
            const access = accessFor(r, settings);
            return {
                ...r.toObject(),
                subscription: access.subscription,
                stats: { dishes: d[r._id]?.n || 0, dishes3d: d[r._id]?.n3d || 0, orders: o[r._id]?.n || 0, revenue: o[r._id]?.revenue || 0, pendingPayments: p[r._id]?.n || 0 },
            };
        }),
        orphans,
        pendingPayments: pending.reduce((t, x) => t + x.n, 0),
    });
});
