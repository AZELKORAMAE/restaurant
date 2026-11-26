import { addMonths, subscriptionState } from '@/lib/subscription';

const DAY = 24 * 60 * 60 * 1000;

/** Extends the subscription from today, or from the current end date if it is still running. */
export function extendSubscription(restaurant, { months = 0, days = 0 }, now = new Date()) {
    const ends = [restaurant.trialEndsAt, restaurant.paidUntil].filter(Boolean).map((d) => new Date(d));
    const currentEnd = ends.sort((a, b) => b - a)[0];
    const start = currentEnd && currentEnd > now ? currentEnd : now;
    const end = new Date(addMonths(start, months).getTime() + days * DAY);
    restaurant.paidUntil = end;
    return { periodStart: start, periodEnd: end };
}

export function subscriptionSummary(restaurant, settings) {
    const s = subscriptionState(restaurant, settings);
    return { ...s, plan: restaurant.plan, trialEndsAt: restaurant.trialEndsAt, paidUntil: restaurant.paidUntil };
}
