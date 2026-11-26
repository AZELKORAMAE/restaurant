import { handler, ok, requireManager, assertId, HttpError } from '@/lib/api';
import { normalizeDishInput } from '@/lib/dishes';
import { deleteOwnedFile } from '@/lib/model-store';
import Dish from '@/models/Dish';

export const maxDuration = 60; // attaching a 3D file runs the studio pipeline

export const PATCH = handler(async (request, { params }) => {
    const { restaurantId, user, access } = await requireManager({ write: true });
    const { id } = await params;
    assertId(id);
    const previous = await Dish.findOne({ _id: id, restaurant: restaurantId });
    if (!previous) throw new HttpError(404, 'Plat introuvable.');
    const owner = user._id.toString();
    const data = await normalizeDishInput(await request.json(), restaurantId, { partial: true, owner, previous, access });

    const dish = await Dish.findOneAndUpdate({ _id: id, restaurant: restaurantId }, { $set: data }, { returnDocument: 'after', runValidators: true })
        .populate('collection').populate('supplements');

    // Free the storage of scan photos the manager removed.
    if (data['model3d.captureImages']) {
        const kept = new Set(data['model3d.captureImages']);
        for (const url of previous.model3d?.captureImages || []) if (!kept.has(url)) await deleteOwnedFile(url, owner);
    }
    return ok(dish);
});

export const DELETE = handler(async (request, { params }) => {
    const { restaurantId } = await requireManager({ write: true });
    const { id } = await params;
    assertId(id);
    const dish = await Dish.findOneAndDelete({ _id: id, restaurant: restaurantId });
    if (!dish) throw new HttpError(404, 'Plat introuvable.');
    return ok({ deleted: id });
});
