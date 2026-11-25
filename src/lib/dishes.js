import Collection from '@/models/Collection';
import Supplement from '@/models/Supplement';
import { HttpError } from '@/lib/api';
import { readFileBuffer, saveFile, mediaIdFromUrl } from '@/lib/gridfs';
import { parseGlb, sceneBounds, normalizeGlb } from '@/lib/glb';

/**
 * Checks an imported scan is a valid GLB. Scanning apps usually export in metres; when the
 * size is clearly wrong (other unit, no scale) the model is resized to the plate's real diameter,
 * so it never appears giant or tiny on the customer's table.
 */
async function checkScan(url, diameterCm, owner) {
    const id = mediaIdFromUrl(url);
    const f = id && await readFileBuffer(id);
    if (!f) throw new HttpError(400, 'Fichier 3D introuvable.');
    let bounds;
    try {
        bounds = sceneBounds(parseGlb(f.buffer).json);
    } catch {
        throw new HttpError(400, 'Ce fichier n’est pas un modèle GLB valide.');
    }
    const footprint = bounds ? Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2]) : 0;
    if (footprint >= 0.05 && footprint <= 1.2) return url;
    const fixed = await saveFile({
        filename: f.file.filename, contentType: 'model/gltf-binary',
        data: normalizeGlb(f.buffer, (diameterCm || 26) / 100), metadata: { owner },
    });
    return `/api/media/${fixed}`;
}

const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v));
const strList = (v) => (Array.isArray(v) ? v : String(v || '').split(','))
    .map((s) => String(s).trim()).filter(Boolean).slice(0, 40);

/** Normalises a dish payload from the dashboard and checks references belong to the restaurant. */
export async function normalizeDishInput(body, restaurantId, { partial = false, owner = '', previousGlb = null } = {}) {
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
        // Only the fields a manager may set by hand; status/task fields are server-managed.
        const m = body.model3d;
        for (const k of ['glb', 'usdz', 'poster', 'source']) if (k in m) data[`model3d.${k}`] = m[k] || null;
        if ('captureImages' in m) data['model3d.captureImages'] = strList(m.captureImages).slice(0, 80);
        if ('realDiameterCm' in m) data['model3d.realDiameterCm'] = num(m.realDiameterCm) ?? 26;
        // A new model makes the dish "ready"; an explicit removal resets it. A running
        // reconstruction ("processing", no glb yet) is left alone.
        if (m.glb || m.status === 'none') {
            data['model3d.status'] = m.glb ? 'ready' : 'none';
            data['model3d.error'] = null;
            data['model3d.updatedAt'] = new Date();
        }
        if (!m.glb && m.status !== 'none') { delete data['model3d.glb']; delete data['model3d.source']; }
        if (m.glb && m.source === 'scan' && m.glb !== previousGlb) {
            data['model3d.glb'] = await checkScan(m.glb, num(m.realDiameterCm), owner);
        }
    }

    if (has('collection')) {
        const ok = body.collection && await Collection.exists({ _id: body.collection, restaurant: restaurantId });
        if (!ok) throw new HttpError(400, 'Collection invalide.');
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
export function publicDish(d) {
    const o = d.toObject ? d.toObject() : d;
    const m = o.model3d || {};
    return {
        ...o,
        model3d: m.status === 'ready'
            ? { status: 'ready', source: m.source, glb: m.glb, usdz: m.usdz, poster: m.poster, realDiameterCm: m.realDiameterCm }
            : { status: 'none' },
    };
}
