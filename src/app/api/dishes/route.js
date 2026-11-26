import { handler, ok, requireManager, HttpError } from '@/lib/api';
import { normalizeDishInput } from '@/lib/dishes';
import Dish from '@/models/Dish';
import '@/models/Collection';
import '@/models/Supplement';

export const maxDuration = 60; // attaching a 3D file runs the studio pipeline

export const GET = handler(async () => {
    const { restaurantId } = await requireManager();
    const dishes = await Dish.find({ restaurant: restaurantId })
        .sort({ createdAt: -1 })
        .populate('collection')
        .populate('supplements');
    return ok(dishes);
});

export const POST = handler(async (request) => {
    const { restaurantId, user, access } = await requireManager({ write: true });
    if (access.maxDishes != null && await Dish.countDocuments({ restaurant: restaurantId }) >= access.maxDishes) {
        throw new HttpError(403, `Votre offre permet ${access.maxDishes} plats. Passez à l’offre supérieure dans l’onglet Abonnement.`, 'plan_limit');
    }
    const data = await normalizeDishInput(await request.json(), restaurantId, { owner: user._id.toString(), access });
    const dish = new Dish({ restaurant: restaurantId });
    Object.entries(data).forEach(([k, v]) => dish.set(k, v));
    await dish.save();
    return ok(dish, 201);
});
