import { handler, ok, requireManager } from '@/lib/api';
import { normalizeDishInput } from '@/lib/dishes';
import Dish from '@/models/Dish';
import '@/models/Collection';
import '@/models/Supplement';

export const GET = handler(async () => {
    const { restaurantId } = await requireManager();
    const dishes = await Dish.find({ restaurant: restaurantId })
        .sort({ createdAt: -1 })
        .populate('collection')
        .populate('supplements');
    return ok(dishes);
});

export const POST = handler(async (request) => {
    const { restaurantId, user } = await requireManager();
    const data = await normalizeDishInput(await request.json(), restaurantId, { owner: user._id.toString() });
    const dish = await Dish.create({ ...data, restaurant: restaurantId });
    return ok(dish, 201);
});
