import { handler, ok, requireManager } from '@/lib/api';
import { PLANS, DURATIONS } from '@/lib/plans';
import { planPrices, priceOf } from '@/lib/subscription';
import Payment from '@/models/Payment';
import Dish from '@/models/Dish';

// The manager's subscription page (also reachable when the subscription has expired).
export const GET = handler(async () => {
    const { restaurant, restaurantId, access, settings, actingAdmin } = await requireManager();
    const prices = planPrices(settings);
    const [payments, dishes, dishes3d] = await Promise.all([
        Payment.find({ restaurant: restaurantId }).sort({ createdAt: -1 }).limit(30),
        Dish.countDocuments({ restaurant: restaurantId }),
        Dish.countDocuments({ restaurant: restaurantId, 'model3d.status': 'ready' }),
    ]);
    return ok({
        plan: restaurant.plan,
        subscription: access.subscription,
        trialEndsAt: restaurant.trialEndsAt,
        paidUntil: restaurant.paidUntil,
        access,
        usage: { dishes, dishes3d },
        currency: settings.currency,
        plans: Object.entries(PLANS).map(([key, p]) => ({
            key, name: p.name, tagline: p.tagline, perks: p.perks, limits: p.limits, monthlyPrice: prices[key],
            durations: DURATIONS.map((months) => ({ months, price: priceOf(settings, key, months) })),
        })),
        paymentInstructions: settings.paymentInstructions,
        contact: { phone: settings.contactPhone, email: settings.contactEmail },
        payments,
        actingAdmin,
    });
});
