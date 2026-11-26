// Subscription plans. Prices are editable by the super-admin (platform settings);
// the features and limits below define what each plan unlocks.
export const PLANS = {
    essentiel: {
        name: 'Essentiel',
        defaultPrice: 199,
        tagline: 'Menu digital et commandes à table',
        limits: { maxDishes: 40, max3d: 5, orders: true, autoScan: false },
        perks: ['Menu QR code par table', 'Commandes à table', "Jusqu'à 40 plats", '5 plats en 3D / AR'],
    },
    pro: {
        name: 'Pro',
        defaultPrice: 399,
        tagline: 'Tout le menu en 3D sur la table',
        limits: { maxDishes: null, max3d: null, orders: true, autoScan: false },
        perks: ['Plats illimités', 'Plats 3D / AR illimités', 'Studio 3D (recadrage, dimensions)', 'Import de scans professionnels'],
    },
    premium: {
        name: 'Premium',
        defaultPrice: 799,
        tagline: 'Scan 3D automatique haut de gamme',
        limits: { maxDishes: null, max3d: null, orders: true, autoScan: true },
        perks: ['Tout le plan Pro', 'Scan 3D automatique depuis vos photos', 'Rendu photogrammétrique 4K', 'Support prioritaire'],
    },
};

export const PLAN_KEYS = Object.keys(PLANS);
export const DURATIONS = [1, 3, 6, 12];

/** Price for `months` of `plan`: 12 months = 10 paid (2 months offered). */
export function priceFor(plan, months, prices = {}) {
    const monthly = Number(prices?.[plan] ?? PLANS[plan]?.defaultPrice ?? 0);
    const paidMonths = months >= 12 ? months - 2 * Math.floor(months / 12) : months;
    return Math.round(monthly * paidMonths * 100) / 100;
}
