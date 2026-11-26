import bcrypt from 'bcryptjs';
import { handler, ok, HttpError } from '@/lib/api';
import { uniqueSlug } from '@/lib/slug';
import { sendMail } from '@/lib/mailer';
import { siteOrigin } from '@/lib/api';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';

const clean = (v, max) => String(v || '').trim().slice(0, max);

// Public: a manager asks for an account. It stays "pending" until a super-admin approves it.
export const POST = handler(async (request) => {
    const b = await request.json();
    const name = clean(b.name, 80);
    const email = clean(b.email, 120).toLowerCase();
    const phone = clean(b.phone, 30);
    const password = String(b.password || '');
    const restaurantName = clean(b.restaurantName, 80);

    if (!name || !restaurantName || !phone) throw new HttpError(400, 'Merci de remplir tous les champs obligatoires.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Adresse e-mail invalide.');
    if (password.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');
    if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase()) throw new HttpError(409, 'Cette adresse est déjà utilisée.');
    if (await User.exists({ email })) throw new HttpError(409, 'Une demande existe déjà pour cette adresse e-mail.');

    const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 10) });
    try {
        const restaurant = await Restaurant.create({
            name: restaurantName,
            slug: await uniqueSlug(Restaurant, restaurantName),
            description: clean(b.description, 600),
            cuisine: clean(b.cuisine, 60),
            address: clean(b.address, 200),
            city: clean(b.city, 80),
            phone,
            owner: user._id,
        });
        user.restaurant = restaurant._id;
        await user.save();
    } catch (e) {
        await User.deleteOne({ _id: user._id });
        throw e;
    }
    await Promise.all([
        sendMail({
            to: process.env.ADMIN_EMAIL,
            subject: `Nouvelle demande : ${restaurantName}`,
            title: 'Nouvelle demande de restaurant',
            paragraphs: [`${name} (${email}, ${phone}) demande la création du restaurant « ${restaurantName} ».`],
            cta: { label: 'Voir les demandes', url: `${siteOrigin(request)}/superadmin` },
        }),
        sendMail({
            to: email,
            subject: 'Votre demande est bien reçue',
            title: 'Demande reçue',
            paragraphs: [`Bonjour ${name},`, `Votre demande pour « ${restaurantName} » est en cours de validation. Vous recevrez votre lien d’accès dès qu’elle sera approuvée.`],
        }),
    ]);
    return ok({ status: 'pending' }, 201);
});
