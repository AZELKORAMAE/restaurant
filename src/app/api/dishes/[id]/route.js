import { handler, ok, requireManager, assertId, HttpError } from '@/lib/api';
import { normalizeDishInput } from '@/lib/dishes';
import Dish from '@/models/Dish';

export const PATCH = handler(async (request, { params }) => {
    const { restaurantId, user } = await requireManager();
    const { id } = await params;
    assertId(id);
    const current = await Dish.findOne({ _id: id, restaurant: restaurantId }).select('model3d.glb');
    if (!current) throw new HttpError(404, 'Plat introuvable.');
    const data = await normalizeDishInput(await request.json(), restaurantId, {
        partial: true, owner: user._id.toString(), previousGlb: current.model3d?.glb,
    });
    const dish = await Dish.findOneAndUpdate({ _id: id, restaurant: restaurantId }, { $set: data }, { new: true, runValidators: true })
        .populate('collection').populate('supplements');
    if (!dish) throw new HttpError(404, 'Plat introuvable.');
    return ok(dish);
});

export const DELETE = handler(async (request, { params }) => {
    const { restaurantId } = await requireManager();
    const { id } = await params;
    assertId(id);
    const dish = await Dish.findOneAndDelete({ _id: id, restaurant: restaurantId });
    if (!dish) throw new HttpError(404, 'Plat introuvable.');
    return ok({ deleted: id });
});
