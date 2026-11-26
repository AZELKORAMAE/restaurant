import { handler, ok, requireSuperAdmin, assertId, siteOrigin, HttpError } from '@/lib/api';
import { extendSubscription } from '@/lib/billing';
import { sendMail } from '@/lib/mailer';
import { PLANS } from '@/lib/plans';
import Payment from '@/models/Payment';
import Restaurant from '@/models/Restaurant';
import User from '@/models/User';

/** Validate (extends the subscription and sets the plan) or reject a declared payment. */
export const PATCH = handler(async (request, { params }) => {
    await requireSuperAdmin();
    const { id } = await params;
    assertId(id);
    const { action, note } = await request.json();
    const payment = await Payment.findById(id);
    if (!payment) throw new HttpError(404, 'Paiement introuvable.');
    if (payment.status !== 'pending') throw new HttpError(409, 'Ce paiement a déjà été traité.');
    const restaurant = await Restaurant.findById(payment.restaurant);
    if (!restaurant) throw new HttpError(404, 'Restaurant introuvable.');
    const owner = await User.findById(restaurant.owner);

    if (action === 'validate') {
        restaurant.plan = payment.plan;
        const period = extendSubscription(restaurant, { months: payment.months, days: payment.days || 0 });
        await restaurant.save();
        Object.assign(payment, { status: 'validated', validatedAt: new Date(), note, ...period });
        await payment.save();
        await sendMail({
            to: owner?.email,
            subject: 'Paiement validé — abonnement prolongé',
            title: 'Merci, votre paiement est validé',
            paragraphs: [`Votre abonnement ${PLANS[payment.plan].name} est actif jusqu’au ${period.periodEnd.toLocaleDateString('fr-FR')}.`],
            cta: { label: 'Ouvrir mon espace', url: `${siteOrigin(request)}/admin/login` },
        });
    } else if (action === 'reject') {
        Object.assign(payment, { status: 'rejected', note });
        await payment.save();
        await sendMail({
            to: owner?.email,
            subject: 'Paiement non validé',
            title: 'Votre paiement n’a pas pu être validé',
            paragraphs: [note ? `Motif : ${note}` : 'Contactez-nous pour régulariser votre abonnement.'],
            cta: { label: 'Voir mon abonnement', url: `${siteOrigin(request)}/admin/login` },
        });
    } else {
        throw new HttpError(400, 'Action inconnue.');
    }
    return ok(payment);
});
