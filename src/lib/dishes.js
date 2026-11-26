import Collection from '@/models/Collection';
import Supplement from '@/models/Supplement';
import Dish from '@/models/Dish';
import { HttpError } from '@/lib/api';
import { processStoredModel } from '@/lib/model-store';

const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v));
const strList = (v) => (Array.isArray(v) ? v : String(v || '').split(','))
    .map((s) => String(s).trim()).filter(Boolean).slice(0, 40);

/** Throws when the plan / restrictions do not allow one more 3D dish. */
export async function assert3dAllowed(access, restaurantId, dishId = null) {
    if (!access.can3d) throw new HttpError(403, 'Les plats en 3D sont désactivés pour votre compte.', 'feature_disabled');
    if (access.max3d != null) {
        const count = await Dish.countDocuments({ restaurant: restaurantId, 'model3d.status': 'ready', ...(dishId ? { _id: { $ne: dishId } } : {}) });
        if (count >= access.max3d) {
            throw new HttpError(403, `Votre offre permet ${access.max3d} plats en 3D. Passez à l’offre Pro pour la 3D illimitée.`, 'plan_limit');
        }
    }
}

/**
 * Normalises a dish payload from the dashboard and checks references belong to the restaurant.
 * A newly attached 3D file (imported scan or photo preview) goes through the studio pipeline.
 */
export async function normalizeDishInput(body, restaurantId, { partial = false, owner = '', previous = null, access = null } = {}) {
    const data = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

    for (const k of ['name', 'description', 'image']) if (has(k)) data[k] = String(body[k] ?? '').trim();
    if (has('isActive')) data.isActive = Boolean(body.isActive);
    if (has('price')) data.price = num(body.price);
    if (has('prepTime')) data.prepTime = num(body.prepTime) ?? null;
    if (has('calories')) data.calories = num(body.calories) ?? null;
    if (has('images')) data.images = strList(body.images).slice(0, 12);
    if (has('allergens')) data.allergens = strList(body.allergens);
    if (has('tags')) data.tags = strList(body.tags);
    if (has('sizes')) {
        data.sizes = (body.sizes || [])
            .filter((s) => s && String(s.name || '').trim())
            .map((s) => ({ name: String(s.name).trim(), price: num(s.price) ?? 0 }));
    }
    if (has('ingredients')) {
        data.ingredients = (body.ingredients || [])
            .map((i) => (typeof i === 'string' ? { name: i } : i))
            .filter((i) => i && String(i.name || '').trim())
            .map((i) => ({ name: String(i.name).trim(), quantity: String(i.quantity || '').trim() }));
    }

    if (has('model3d') && body.model3d && typeof body.model3d === 'object') {
        // Only the fields a manager may set by hand; status/task/processing fields are server-managed.
        const m = body.model3d;
        if ('poster' in m) data['model3d.poster'] = m.poster || null;
        if ('usdz' in m) data['model3d.usdz'] = m.usdz || null;
        if ('captureImages' in m) data['model3d.captureImages'] = strList(m.captureImages).slice(0, 300);
        if ('realDiameterCm' in m) data['model3d.realDiameterCm'] = num(m.realDiameterCm) ?? 26;

        const prevGlb = previous?.model3d?.glb || null;
        const prevOriginal = previous?.model3d?.originalGlb || null;
        const isNewFile = m.glb && m.glb !== prevGlb && m.glb !== prevOriginal;

        if (isNewFile) {
            if (access) await assert3dAllowed(access, restaurantId, previous?._id);
            const source = ['scan', 'plate'].includes(m.source) ? m.source : 'scan';
            // Scans from apps are usually metric: keep their size (fixed automatically if clearly wrong).
            // Photo previews are generated at the requested diameter already.
            const reference = { axis: 'keep', fallbackCm: num(m.realDiameterCm) || 26 };
            const processed = await processStoredModel(m.glb, { reference, quality: 'balanced' }, { owner, name: body.name || previous?.name });
            Object.assign(data, {
                'model3d.glb': processed.glb,
                'model3d.originalGlb': m.glb,
                'model3d.source': source,
                'model3d.provider': null,
                'model3d.dimensions': processed.dimensions,
                'model3d.triangles': processed.triangles,
                'model3d.reference': { axis: 'keep', cm: null },
                'model3d.rotation': [0, 0, 0],
                'model3d.crop': {},
                'model3d.quality': 'balanced',
                'model3d.realDiameterCm': processed.dimensions.widthCm,
                'model3d.status': 'ready',
                'model3d.error': null,
                'model3d.poster': m.poster || null,
                'model3d.updatedAt': new Date(),
            });
        } else if (!m.glb && m.status === 'none' && previous?.model3d?.status !== 'processing') {
            // Explicit removal of the model (captured photos are kept)
            Object.assign(data, {
                'model3d.glb': null, 'model3d.originalGlb': null, 'model3d.usdz': null, 'model3d.poster': null,
                'model3d.source': null, 'model3d.provider': null, 'model3d.dimensions': null,
                'model3d.status': 'none', 'model3d.error': null, 'model3d.updatedAt': new Date(),
            });
        }
    }

    if (has('collection')) {
        const okColl = body.collection && await Collection.exists({ _id: body.collection, restaurant: restaurantId });
        if (!okColl) throw new HttpError(400, 'Collection invalide.');
        data.collection = body.collection;
    }
    if (has('supplements')) {
        const ids = (body.supplements || []).map((s) => s?._id || s);
        const count = ids.length ? await Supplement.countDocuments({ _id: { $in: ids }, restaurant: restaurantId }) : 0;
        if (count !== ids.length) throw new HttpError(400, 'Supplément invalide.');
        data.supplements = ids;
    }

    if (!partial) {
        for (const k of ['name', 'description', 'image', 'collection']) {
            if (!data[k]) throw new HttpError(400, `Champ obligatoire manquant : ${k}.`);
        }
        if (data.price === undefined) throw new HttpError(400, 'Prix obligatoire.');
    }
    return data;
}

/** Shape of a dish for the public menu. */
export function publicDish(d, { with3d = true } = {}) {
    const o = d.toObject ? d.toObject() : d;
    const m = o.model3d || {};
    return {
        ...o,
        model3d: with3d && m.status === 'ready' && m.glb
            ? { status: 'ready', source: m.source, glb: m.glb, usdz: m.usdz, poster: m.poster, dimensions: m.dimensions, realDiameterCm: m.realDiameterCm }
            : { status: 'none' },
    };
}
