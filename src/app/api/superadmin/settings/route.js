import { handler, ok, requireSuperAdmin, HttpError } from '@/lib/api';
import { getSettings, planPrices } from '@/lib/subscription';
import { PLANS } from '@/lib/plans';
import { mailEnabled } from '@/lib/mailer';
import { kiriEnabled } from '@/lib/kiri';
import { meshyEnabled } from '@/lib/meshy';

export const GET = handler(async () => {
    await requireSuperAdmin();
    const s = await getSettings();
    return ok({
        settings: { ...s.toObject(), prices: planPrices(s) },
        plans: Object.entries(PLANS).map(([key, p]) => ({ key, name: p.name, perks: p.perks })),
        services: { mail: mailEnabled(), kiri: kiriEnabled(), meshy: meshyEnabled() },
    });
});

export const PATCH = handler(async (request) => {
    await requireSuperAdmin();
    const b = await request.json();
    const s = await getSettings();
    const int = (v, min, max) => {
        const n = parseInt(v, 10);
        if (!(n >= min && n <= max)) throw new HttpError(400, `Valeur entre ${min} et ${max} attendue.`);
        return n;
    };
    if ('trialDays' in b) s.trialDays = int(b.trialDays, 0, 365);
    if ('graceDays' in b) s.graceDays = int(b.graceDays, 0, 60);
    if ('reminderDays' in b) s.reminderDays = int(b.reminderDays, 0, 60);
    if ('defaultPlan' in b && PLANS[b.defaultPlan]) s.defaultPlan = b.defaultPlan;
    for (const k of ['currency', 'paymentInstructions', 'contactPhone', 'contactEmail', 'countryCode']) {
        if (k in b) s[k] = String(b[k] ?? '').slice(0, k === 'paymentInstructions' ? 2000 : 120);
    }
    if (b.prices && typeof b.prices === 'object') {
        s.prices = Object.fromEntries(Object.keys(PLANS).map((k) => [k, Math.max(0, Number(b.prices[k] ?? planPrices(s)[k]) || 0)]));
        s.markModified('prices');
    }
    await s.save();
    return ok({ ...s.toObject(), prices: planPrices(s) });
});
