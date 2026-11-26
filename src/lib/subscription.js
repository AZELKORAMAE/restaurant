import PlatformSettings from '@/models/PlatformSettings';
import { PLANS, priceFor } from '@/lib/plans';

const DAY = 24 * 60 * 60 * 1000;

export async function getSettings() {
    const s = await PlatformSettings.findOneAndUpdate(
        { key: 'platform' },
        { $setOnInsert: { key: 'platform' } },
        { upsert: true, returnDocument: 'after' }
    );
    return s;
}

export function planPrices(settings) {
    return Object.fromEntries(Object.entries(PLANS).map(([k, p]) => [k, Number(settings?.prices?.[k] ?? p.defaultPrice)]));
}

export function priceOf(settings, plan, months) {
    return priceFor(plan, months, planPrices(settings));
}

export const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

/**
 * Subscription state of a restaurant.
 *   trial   – inside the free trial
 *   active  – paid
 *   grace   – expired less than `graceDays` ago: everything still works, with a warning
 *   expired – blocked: menu offline, dashboard limited to the subscription page
 */
export function subscriptionState(restaurant, settings, now = new Date()) {
    // Restaurants validated before subscriptions existed: trial counted from their validation.
    const legacyStart = !restaurant.trialEndsAt && !restaurant.paidUntil ? (restaurant.reviewedAt || restaurant.createdAt) : null;
    const trialEnd = restaurant.trialEndsAt ? new Date(restaurant.trialEndsAt)
        : legacyStart ? new Date(new Date(legacyStart).getTime() + (settings?.trialDays ?? 14) * DAY) : null;
    const paidEnd = restaurant.paidUntil ? new Date(restaurant.paidUntil) : null;
    const endsAt = [trialEnd, paidEnd].filter(Boolean).sort((a, b) => b - a)[0] || null;
    const graceDays = settings?.graceDays ?? 5;
    const reminderDays = settings?.reminderDays ?? 7;

    if (!endsAt) return { state: 'expired', endsAt: null, daysLeft: 0, graceEndsAt: null, warn: true };
    const daysLeft = Math.ceil((endsAt - now) / DAY);
    const graceEndsAt = new Date(endsAt.getTime() + graceDays * DAY);

    let state;
    if (now <= endsAt) state = paidEnd && paidEnd >= now ? 'active' : 'trial';
    else if (now <= graceEndsAt) state = 'grace';
    else state = 'expired';

    return {
        state,
        endsAt,
        graceEndsAt,
        daysLeft,
        graceDaysLeft: Math.max(0, Math.ceil((graceEndsAt - now) / DAY)),
        warn: state === 'grace' || state === 'expired' || daysLeft <= reminderDays,
    };
}

/** What the restaurant may do right now (plan + subscription + super-admin restrictions). */
export function accessFor(restaurant, settings, now = new Date()) {
    const sub = subscriptionState(restaurant, settings, now);
    const plan = PLANS[restaurant.plan] || PLANS.pro;
    const r = restaurant.restrictions || {};
    const live = sub.state !== 'expired';
    const maxDishes = r.maxDishes ?? plan.limits.maxDishes;

    return {
        subscription: sub,
        plan: restaurant.plan,
        live,
        canEdit: live && !r.readOnly,
        canOrder: live && !r.ordersDisabled && plan.limits.orders && restaurant.acceptsOrders !== false,
        can3d: live && !r.threeDDisabled,
        canAutoScan: live && !r.threeDDisabled && plan.limits.autoScan,
        maxDishes: maxDishes ?? null,
        max3d: plan.limits.max3d ?? null,
        restrictions: r,
    };
}
