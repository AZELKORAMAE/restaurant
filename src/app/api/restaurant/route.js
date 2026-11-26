import { handler, ok, requireManager, HttpError } from '@/lib/api';
import { slugify } from '@/lib/slug';
import Restaurant from '@/models/Restaurant';
import { kiriEnabled, KIRI_MIN_PHOTOS } from '@/lib/kiri';
import { meshyEnabled } from '@/lib/meshy';

const EDITABLE = ['name', 'description', 'cuisine', 'address', 'city', 'phone', 'logo', 'coverImage', 'currency', 'acceptsOrders'];

// The signed-in manager's own restaurant.
export const GET = handler(async () => {
    const { restaurant, user, access, actingAdmin } = await requireManager();
    return ok({
        restaurant,
        manager: { name: user.name, email: user.email },
        access,
        actingAdmin,
        features: {
            // Automatic scan: photogrammetry (KIRI) or AI (Meshy), included in the Premium plan
            autoScan: Boolean(kiriEnabled() || meshyEnabled()),
            photogrammetry: kiriEnabled(),
            minScanPhotos: kiriEnabled() ? KIRI_MIN_PHOTOS : 4,
        },
    });
});

export const PATCH = handler(async (request) => {
    const { restaurant } = await requireManager({ write: true });
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
