import { handler, ok, requireManager, sanitize, assertId, HttpError } from '@/lib/api';

/**
 * Manager-scoped CRUD route handlers. Every query is filtered by the signed-in
 * manager's restaurant, so a manager can never read or change another restaurant's data.
 */
export function listRoutes(Model, { sort = { createdAt: -1 }, populate = [] } = {}) {
    return {
        GET: handler(async () => {
            const { restaurantId } = await requireManager();
            let query = Model.find({ restaurant: restaurantId }).sort(sort);
            for (const p of populate) query = query.populate(p);
            return ok(await query);
        }),
        POST: handler(async (request) => {
            const { restaurantId } = await requireManager({ write: true });
            const doc = await Model.create({ ...sanitize(await request.json()), restaurant: restaurantId });
            return ok(doc, 201);
        }),
    };
}

export function itemRoutes(Model, { updatable = null, write = true } = {}) {
    return {
        PATCH: handler(async (request, { params }) => {
            const { restaurantId } = await requireManager({ write });
            const { id } = await params;
            assertId(id);
            let body = sanitize(await request.json());
            if (updatable) body = Object.fromEntries(Object.entries(body).filter(([k]) => updatable.includes(k)));
            const doc = await Model.findOneAndUpdate({ _id: id, restaurant: restaurantId }, body, { returnDocument: 'after', runValidators: true });
            if (!doc) throw new HttpError(404, 'Élément introuvable.');
            return ok(doc);
        }),
        DELETE: handler(async (request, { params }) => {
            const { restaurantId } = await requireManager({ write: true });
            const { id } = await params;
            assertId(id);
            const doc = await Model.findOneAndDelete({ _id: id, restaurant: restaurantId });
            if (!doc) throw new HttpError(404, 'Élément introuvable.');
            return ok({ deleted: id });
        }),
    };
}
