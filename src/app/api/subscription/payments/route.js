import { handler, ok, requireManager, HttpError } from '@/lib/api';
import { PLANS, DURATIONS } from '@/lib/plans';
import { priceOf } from '@/lib/subscription';
import { sendMail } from '@/lib/mailer';
import Payment from '@/models/Payment';

const METHODS = ['virement', 'especes', 'cheque', 'carte', 'autre'];

// The manager declares a payment (bank transfer receipt…). The super-admin validates it.
export const POST = handler(async (request) => {
    const { restaurant, restaurantId, settings } = await requireManager();
    const b = await request.json();
    if (!PLANS[b.plan]) throw new HttpError(400, 'Offre inconnue.');
    const months = Number(b.months);
    if (!DURATIONS.includes(months)) throw new HttpError(400, 'Durée invalide.');
    if (await Payment.exists({ restaurant: restaurantId, status: 'pending' })) {
        throw new HttpError(409, 'Un paiement est déjà en cours de vérification.');
    }
    const payment = await Payment.create({
        restaurant: restaurantId,
        plan: b.plan,
        months,
        amount: priceOf(settings, b.plan, months),
        currency: settings.currency,
        method: METHODS.includes(b.method) ? b.method : 'virement',
        reference: String(b.reference || '').slice(0, 120),
        receiptUrl: typeof b.receiptUrl === 'string' && b.receiptUrl.startsWith('/api/media/') ? b.receiptUrl : undefined,
        declaredBy: 'manager',
    });
    await sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `Paiement à vérifier — ${restaurant.name}`,
        title: 'Nouveau paiement déclaré',
        paragraphs: [`${restaurant.name} a déclaré un paiement de ${payment.amount} ${payment.currency} (${PLANS[b.plan].name}, ${months} mois).`, 'Validez-le dans l’espace administrateur, onglet Paiements.'],
    });
    return ok(payment, 201);
});
