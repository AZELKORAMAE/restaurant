import bcrypt from 'bcryptjs';
import { handler, ok, HttpError } from '@/lib/api';
import { uniqueSlug } from '@/lib/slug';
import { sendMail } from '@/lib/mailer';
import { siteOrigin } from '@/lib/api';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import { saveFile, deleteFile } from '@/lib/gridfs';
import { normalizeLocation } from '@/lib/location';
import { normalizeTheme, COVER_PRESETS } from '@/lib/theme';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE = 4 * 1024 * 1024;

/** Accepts JSON, or multipart (field "data" = JSON, files "logo" and "cover"). */
async function readBody(request) {
    if (!(request.headers.get('content-type') || '').includes('multipart/form-data')) return { body: await request.json(), files: {} };
    const form = await request.formData();
    let body;
    try { body = JSON.parse(String(form.get('data') || '{}')); } catch { throw new HttpError(400, 'Formulaire invalide.'); }
    const files = {};
    for (const key of ['logo', 'cover']) {
        const f = form.get(key);
        if (!f || typeof f === 'string') continue;
        if (!IMAGE_TYPES.includes(f.type)) throw new HttpError(400, 'Images acceptées : JPEG, PNG ou WebP.');
        if (f.size > MAX_IMAGE) throw new HttpError(413, 'Image trop lourde (4 Mo max).');
        files[key] = f;
    }
    return { body, files };
}

const clean = (v, max) => String(v || '').trim().slice(0, max);

// Public: a manager asks for an account. It stays "pending" until a super-admin approves it.
export const POST = handler(async (request) => {
    const { body: b, files } = await readBody(request);
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
    const stored = [];
    try {
        const owner = user._id.toString();
        const save = async (f) => {
            const id = await saveFile({ filename: f.name || 'image', contentType: f.type, data: Buffer.from(await f.arrayBuffer()), metadata: { owner } });
            stored.push(id);
            return `/api/media/${id}`;
        };
        const logo = files.logo ? await save(files.logo) : undefined;
        const coverImage = files.cover ? await save(files.cover)
            : COVER_PRESETS.find((p) => p.url === b.coverPreset)?.url;
        const location = normalizeLocation(b.location);
        const restaurant = await Restaurant.create({
            name: restaurantName,
            slug: await uniqueSlug(Restaurant, restaurantName),
            description: clean(b.description, 600),
            cuisine: clean(b.cuisine, 60),
            city: clean(b.city, 80),
            phone,
            logo,
            coverImage,
            location: location || undefined,
            address: clean(b.address, 200) || location?.address?.slice(0, 200),
            theme: normalizeTheme(b.theme),
            owner: user._id,
        });
        user.restaurant = restaurant._id;
        await user.save();
    } catch (e) {
        await User.deleteOne({ _id: user._id });
        for (const id of stored) await deleteFile(id).catch(() => {});
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
