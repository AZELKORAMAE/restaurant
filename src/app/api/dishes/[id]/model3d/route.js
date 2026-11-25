import { handler, ok, requireManager, assertId, HttpError } from '@/lib/api';
import { readFileBuffer, saveFile, mediaIdFromUrl } from '@/lib/gridfs';
import { normalizeGlb } from '@/lib/glb';
import { meshyEnabled, startReconstruction, getReconstruction, spread } from '@/lib/meshy';
import Dish from '@/models/Dish';

async function loadDish(params, restaurantId) {
    const { id } = await params;
    assertId(id);
    const dish = await Dish.findOne({ _id: id, restaurant: restaurantId });
    if (!dish) throw new HttpError(404, 'Plat introuvable.');
    return dish;
}

async function toDataUri(url) {
    const id = mediaIdFromUrl(url);
    const f = id && await readFileBuffer(id);
    if (!f) return null;
    return `data:${f.contentType || 'image/jpeg'};base64,${f.buffer.toString('base64')}`;
}

async function saveRealSizeGlb(buffer, dish, owner) {
    const diameter = (dish.model3d?.realDiameterCm || 26) / 100;
    const id = await saveFile({
        filename: `${dish.name}.glb`,
        contentType: 'model/gltf-binary',
        data: normalizeGlb(buffer, diameter),
        metadata: { owner },
    });
    return `/api/media/${id}`;
}

/** Starts the AI reconstruction from the photos captured around the dish. */
export const POST = handler(async (request, { params }) => {
    const { restaurantId } = await requireManager();
    if (!meshyEnabled()) {
        throw new HttpError(501, 'La reconstruction automatique n’est pas activée (MESHY_API_KEY manquante). Importez un scan GLB à la place.');
    }
    const dish = await loadDish(params, restaurantId);
    if (dish.model3d?.status === 'processing') throw new HttpError(409, 'Une reconstruction est déjà en cours.');

    const photos = dish.model3d?.captureImages?.length ? dish.model3d.captureImages : [dish.image, ...(dish.images || [])];
    const images = (await Promise.all(spread(photos.filter(Boolean), 4).map(toDataUri))).filter(Boolean);
    if (!images.length) throw new HttpError(400, 'Aucune photo exploitable. Faites d’abord la capture du plat.');

    const taskId = await startReconstruction(images);
    dish.set('model3d.status', 'processing');
    dish.set('model3d.taskId', taskId);
    dish.set('model3d.progress', 0);
    dish.set('model3d.error', null);
    dish.set('model3d.updatedAt', new Date());
    await dish.save();
    return ok(dish.model3d, 202);
});

/** Polls the reconstruction; when finished, the model is copied into our own storage. */
export const GET = handler(async (request, { params }) => {
    const { restaurantId, user } = await requireManager();
    const dish = await loadDish(params, restaurantId);
    const m = dish.model3d || {};
    if (m.status !== 'processing' || !m.taskId || !meshyEnabled()) return ok(m);

    const t = await getReconstruction(m.taskId);
    if (t.status === 'SUCCEEDED' && t.glb) {
        const res = await fetch(t.glb, { cache: 'no-store' });
        if (!res.ok) throw new HttpError(502, `Téléchargement du modèle impossible (${res.status}).`);
        // Real-size GLB; the iPhone USDZ is then generated from it by the viewer, so both share the same scale.
        const glb = await saveRealSizeGlb(Buffer.from(await res.arrayBuffer()), dish, user._id.toString());
        for (const [k, v] of Object.entries({ status: 'ready', source: 'ai', glb, usdz: null, progress: 100, error: null })) dish.set(`model3d.${k}`, v);
    } else if (t.status === 'FAILED' || t.status === 'CANCELED') {
        dish.set('model3d.status', 'failed');
        dish.set('model3d.error', t.error || 'La reconstruction a échoué. Reprenez des photos plus nettes, bien éclairées.');
    } else {
        dish.set('model3d.progress', t.progress);
    }
    dish.set('model3d.updatedAt', new Date());
    await dish.save();
    return ok(dish.model3d);
});

/**
 * Changes the real diameter of the plate and re-bakes the scale into the GLB
 * (AI models and photo previews; scans keep their measured size).
 */
export const PUT = handler(async (request, { params }) => {
    const { restaurantId, user } = await requireManager();
    const dish = await loadDish(params, restaurantId);
    const cm = Number((await request.json()).realDiameterCm);
    if (!(cm >= 5 && cm <= 120)) throw new HttpError(400, 'Diamètre entre 5 et 120 cm.');
    dish.set('model3d.realDiameterCm', cm);
    const m = dish.model3d;
    if (m.status === 'ready' && m.glb && m.source !== 'scan') {
        const f = await readFileBuffer(mediaIdFromUrl(m.glb));
        if (f) dish.set('model3d.glb', await saveRealSizeGlb(f.buffer, dish, user._id.toString()));
    }
    dish.set('model3d.updatedAt', new Date());
    await dish.save();
    return ok(dish.model3d);
});

/** Removes the 3D model (photos captured are kept). */
export const DELETE = handler(async (request, { params }) => {
    const { restaurantId } = await requireManager();
    const dish = await loadDish(params, restaurantId);
    for (const k of ['glb', 'usdz', 'taskId', 'source', 'error']) dish.set(`model3d.${k}`, null);
    dish.set('model3d.status', 'none');
    await dish.save();
    return ok(dish.model3d);
});
