import { handler, ok, findPublicRestaurant } from '@/lib/api';
import { publicDish } from '@/lib/dishes';
import Collection from '@/models/Collection';
import Dish from '@/models/Dish';
import '@/models/Supplement';

// Public menu: everything the customer app needs in one request.
export const GET = handler(async (request, { params }) => {
    const { slug } = await params;
    const { restaurant: r, access } = await findPublicRestaurant(slug);
    const [collections, dishes] = await Promise.all([
        Collection.find({ restaurant: r._id }).sort({ name: 1 }),
        Dish.find({ restaurant: r._id }).sort({ createdAt: -1 }).populate('collection').populate({ path: 'supplements', match: { isActive: true } }),
    ]);
    return ok({
        restaurant: {
            _id: r._id, name: r.name, slug: r.slug, description: r.description, cuisine: r.cuisine,
            address: r.address, city: r.city, phone: r.phone, logo: r.logo, coverImage: r.coverImage,
            currency: r.currency, acceptsOrders: access.canOrder, location: r.location, theme: r.theme,
        },
        collections,
        dishes: dishes.map((d) => publicDish(d, { with3d: access.can3d })),
    });
});
