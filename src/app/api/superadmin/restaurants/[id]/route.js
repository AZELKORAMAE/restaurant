import { handler, ok, requireSuperAdmin, assertId, siteOrigin, HttpError } from '@/lib/api';
import { getSettings } from '@/lib/subscription';
import { extendSubscription } from '@/lib/billing';
import { sendMail, accessMessage, whatsappLink, mailEnabled } from '@/lib/mailer';
import { PLANS } from '@/lib/plans';
import Restaurant from '@/models/Restaurant';
import Payment from '@/models/Payment';
import User from '@/models/User';

const DAY = 24 * 60 * 60 * 1000;
const TRANSITIONS = {
    approve: { from: ['pending', 'rejected', 'suspended'], to: 'approved' },
    reject: { from: ['pending'], to: 'rejected' },
    suspend: { from: ['approved'], to: 'suspended' },
};

/** Everything the admin needs to send the access link to the manager. */
async function shareAccess(request, restaurant, owner, settings, { email = true } = {}) {
    const loginUrl = `${siteOrigin(request)}/admin/login?email=${encodeURIComponent(owner.email)}`;
    const message = accessMessage({ managerName: owner.name, restaurantName: restaurant.name, loginUrl, email: owner.email });
    const emailSent = email && await sendMail({
        to: owner.email,
        subject: `Votre restaurant « ${restaurant.name} » est validé`,
        title: 'Bienvenue sur Menu3D !',
        paragraphs: [
            `Bonjour ${owner.name},`,
            `Votre restaurant « ${restaurant.name} » est validé. Vous pouvez dès maintenant créer votre menu, mettre vos plats en 3D et imprimer les QR codes de vos tables.`,
            `Identifiant : ${owner.email} (mot de passe choisi lors de votre demande).`,
        ],
        cta: { label: 'Accéder à mon espace', url: loginUrl },
    });
    if (emailSent) restaurant.accessSentAt = new Date();
    return {
        loginUrl,
        message,
        emailSent: Boolean(emailSent),
        mailConfigured: mailEnabled(),
        whatsapp: whatsappLink(owner.phone, message, settings.countryCode),
        mailto: `mailto:${owner.email}?subject=${encodeURIComponent(`Accès à votre espace Menu3D — ${restaurant.name}`)}&body=${encodeURIComponent(message)}`,
    };
}

export const PATCH = handler(async (request, { params }) => {
    await requireSuperAdmin();
    const { id } = await params;
    assertId(id);
    const body = await request.json();
    const { action, note } = body;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) throw new HttpError(404, 'Restaurant introuvable.');
    const owner = await User.findById(restaurant.owner);
    const settings = await getSettings();
    let share = null;

    if (TRANSITIONS[action]) {
        const t = TRANSITIONS[action];
        if (!t.from.includes(restaurant.status)) throw new HttpError(409, `Impossible depuis le statut « ${restaurant.status} ».`);
        restaurant.status = t.to;
        restaurant.reviewNote = note ? String(note).slice(0, 500) : undefined;
        restaurant.reviewedAt = new Date();
        if (owner) await User.updateOne({ _id: owner._id }, { status: t.to });

        if (action === 'approve') {
            // First approval: start the free trial on the default plan.
            if (!restaurant.trialEndsAt && !restaurant.paidUntil) {
                restaurant.trialEndsAt = new Date(Date.now() + (settings.trialDays ?? 14) * DAY);
                restaurant.plan = settings.defaultPlan || 'pro';
            }
            if (owner) share = await shareAccess(request, restaurant, owner, settings);
        } else if (owner) {
            await sendMail({
                to: owner.email,
                subject: action === 'reject' ? 'Votre demande n’a pas été retenue' : 'Votre compte est suspendu',
                title: action === 'reject' ? 'Demande non retenue' : 'Compte suspendu',
                paragraphs: [note ? `Motif : ${note}` : 'Contactez-nous pour plus d’informations.'],
            });
        }
    } else if (action === 'send-access') {
        if (restaurant.status !== 'approved' || !owner) throw new HttpError(409, 'Le restaurant doit être validé.');
        share = await shareAccess(request, restaurant, owner, settings, { email: body.email !== false });
    } else if (action === 'subscription') {
        // Plan change and/or manual extension (cash payment, gift, correction…)
        if (body.plan) {
            if (!PLANS[body.plan]) throw new HttpError(400, 'Offre inconnue.');
            restaurant.plan = body.plan;
        }
        const months = Math.max(0, parseInt(body.addMonths, 10) || 0);
        const days = parseInt(body.addDays, 10) || 0;
        if (months || days > 0) {
            const period = extendSubscription(restaurant, { months, days: Math.max(0, days) });
            await Payment.create({
                restaurant: restaurant._id, plan: restaurant.plan, months, days: Math.max(0, days),
                amount: Number(body.amount) || 0, currency: settings.currency, method: body.method || 'offert',
                reference: body.reference, status: 'validated', declaredBy: 'admin', note, validatedAt: new Date(), ...period,
            });
        }
        if (body.paidUntil !== undefined) restaurant.paidUntil = body.paidUntil ? new Date(body.paidUntil) : null;
        if (body.endTrial) restaurant.trialEndsAt = new Date();
    } else if (action === 'restrictions') {
        const r = body.restrictions || {};
        restaurant.restrictions = {
            readOnly: Boolean(r.readOnly),
            ordersDisabled: Boolean(r.ordersDisabled),
            threeDDisabled: Boolean(r.threeDDisabled),
            maxDishes: r.maxDishes === '' || r.maxDishes == null ? null : Math.max(0, parseInt(r.maxDishes, 10) || 0),
            note: r.note ? String(r.note).slice(0, 300) : undefined,
        };
    } else {
        throw new HttpError(400, 'Action inconnue.');
    }

    await restaurant.save();
    return ok({ restaurant, share });
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
