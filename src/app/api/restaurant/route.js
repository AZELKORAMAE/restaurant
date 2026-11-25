import { handler, ok, requireManager, HttpError } from '@/lib/api';
import { slugify } from '@/lib/slug';
import Restaurant from '@/models/Restaurant';

const EDITABLE = ['name', 'description', 'cuisine', 'address', 'city', 'phone', 'logo', 'coverImage', 'currency', 'acceptsOrders'];

// The signed-in manager's own restaurant.
export const GET = handler(async () => {
    const { restaurant, user } = await requireManager();
    return ok({
        restaurant,
        manager: { name: user.name, email: user.email },
        features: { aiReconstruction: Boolean(process.env.MESHY_API_KEY) },
    });
});

export const PATCH = handler(async (request) => {
    const { restaurant } = await requireManager();
    const body = await request.json();
    for (const k of EDITABLE) if (k in body) restaurant[k] = body[k];
    if (body.slug && body.slug !== restaurant.slug) {
        const slug = slugify(body.slug);
        if (await Restaurant.exists({ slug, _id: { $ne: restaurant._id } })) throw new HttpError(409, 'Cette adresse de menu est déjà prise.');
        restaurant.slug = slug;
    }
    await restaurant.save();
    return ok(restaurant);
});
