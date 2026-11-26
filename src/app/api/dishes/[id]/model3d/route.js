import { handler, ok, requireManager, assertId, HttpError } from '@/lib/api';
import { readFileBuffer, saveFile, mediaIdFromUrl } from '@/lib/gridfs';
import { processStoredModel, processBuffer, deleteOwnedFile } from '@/lib/model-store';
import { toGlb, QUALITY } from '@/lib/model-pipeline';
import { assert3dAllowed } from '@/lib/dishes';
import { kiriEnabled, startKiriScan, getKiriScan, downloadKiriScan, KIRI_MIN_PHOTOS } from '@/lib/kiri';
import { meshyEnabled, startReconstruction, getReconstruction, spread } from '@/lib/meshy';
import Dish from '@/models/Dish';

export const maxDuration = 60;

async function loadDish(params, restaurantId) {
    const { id } = await params;
    assertId(id);
    const dish = await Dish.findOne({ _id: id, restaurant: restaurantId });
    if (!dish) throw new HttpError(404, 'Plat introuvable.');
    return dish;
}

async function readPhoto(url, i) {
    const id = mediaIdFromUrl(url);
    const f = id && await readFileBuffer(id);
    return f ? { buffer: f.buffer, contentType: f.contentType || 'image/jpeg', filename: `photo-${String(i + 1).padStart(3, '0')}.jpg` } : null;
}

function setModel(dish, fields) {
    for (const [k, v] of Object.entries(fields)) dish.set(`model3d.${k}`, v);
    dish.set('model3d.updatedAt', new Date());
}

/**
 * Starts the automatic 3D reconstruction from the photos captured around the dish.
 *  - KIRI Engine photogrammetry (real scan, 20+ photos) when configured — best realism
 *  - Meshy AI reconstruction (up to 4 photos) otherwise
 */
export const POST = handler(async (request, { params }) => {
    const { restaurantId, access } = await requireManager({ write: true });
    const dish = await loadDish(params, restaurantId);
    if (!access.canAutoScan) {
        throw new HttpError(403, 'Le scan 3D automatique est inclus dans l’offre Premium. Vous pouvez importer un scan GLB ou créer un aperçu.', 'plan_limit');
    }
    await assert3dAllowed(access, restaurantId, dish._id);
    if (dish.model3d?.status === 'processing') throw new HttpError(409, 'Une reconstruction est déjà en cours.');

    const body = await request.json().catch(() => ({}));
    const photos = dish.model3d?.captureImages || [];
    const wantKiri = body.provider !== 'meshy' && kiriEnabled();

    let provider, taskId;
    if (wantKiri) {
        if (photos.length < KIRI_MIN_PHOTOS) {
            throw new HttpError(400, `Le scan photogrammétrique demande au moins ${KIRI_MIN_PHOTOS} photos (vous en avez ${photos.length}). Complétez le scan.`);
        }
        const files = (await Promise.all(photos.slice(0, 300).map(readPhoto))).filter(Boolean);
        taskId = await startKiriScan(files);
        provider = 'kiri';
    } else if (meshyEnabled()) {
        const source = photos.length ? photos : [dish.image, ...(dish.images || [])].filter(Boolean);
        const files = (await Promise.all(spread(source, 4).map(readPhoto))).filter(Boolean);
        if (!files.length) throw new HttpError(400, 'Aucune photo exploitable. Faites d’abord le scan du plat.');
        taskId = await startReconstruction(files.map((f) => `data:${f.contentType};base64,${f.buffer.toString('base64')}`));
        provider = 'meshy';
    } else {
        throw new HttpError(501, 'Le scan automatique n’est pas configuré sur la plateforme (clé KIRI_API_KEY ou MESHY_API_KEY). Importez un scan GLB à la place.');
    }

    setModel(dish, { status: 'processing', provider, taskId, progress: 0, error: null });
    await dish.save();
    return ok(dish.model3d, 202);
});

/** Polls the reconstruction; when finished the model goes through the studio pipeline. */
export const GET = handler(async (request, { params }) => {
    const { restaurantId, user } = await requireManager();
    const dish = await loadDish(params, restaurantId);
    const m = dish.model3d || {};
    if (m.status !== 'processing' || !m.taskId) return ok(m);
    const owner = user._id.toString();

    let raw = null, failed = null, progress = m.progress || 0;
    if (m.provider === 'kiri' && kiriEnabled()) {
        const st = await getKiriScan(m.taskId);
        if (st === 'done') raw = await toGlb(await downloadKiriScan(m.taskId));
        else if (st === 'failed' || st === 'expired') failed = 'La photogrammétrie a échoué : reprenez le scan avec plus de photos, nettes et bien éclairées.';
        else progress = Math.min(95, progress + 3); // KIRI gives no percentage
    } else if (m.provider === 'meshy' && meshyEnabled()) {
        const t = await getReconstruction(m.taskId);
        if (t.status === 'SUCCEEDED' && t.glb) {
            const res = await fetch(t.glb, { cache: 'no-store' });
            if (!res.ok) throw new HttpError(502, `Téléchargement du modèle impossible (${res.status}).`);
            raw = Buffer.from(await res.arrayBuffer());
        } else if (t.status === 'FAILED' || t.status === 'CANCELED') {
            failed = t.error || 'La reconstruction a échoué. Reprenez des photos plus nettes, bien éclairées.';
        } else progress = t.progress;
    }

    if (raw) {
        const originalId = await saveFile({ filename: `${dish.name}-original.glb`, contentType: 'model/gltf-binary', data: raw, metadata: { owner } });
        // Neither photogrammetry without LiDAR nor AI knows the real size: use the plate's diameter.
        const reference = { axis: 'width', cm: m.realDiameterCm || 26 };
        const p = await processBuffer(raw, { reference, quality: 'balanced' }, { owner, name: dish.name });
        setModel(dish, {
            status: 'ready', source: m.provider === 'kiri' ? 'scan' : 'ai', glb: p.glb, originalGlb: `/api/media/${originalId}`,
            dimensions: p.dimensions, triangles: p.triangles, reference, rotation: [0, 0, 0], crop: {}, quality: 'balanced',
            usdz: null, poster: null, progress: 100, error: null,
        });
    } else if (failed) {
        setModel(dish, { status: 'failed', error: failed });
    } else {
        setModel(dish, { progress });
    }
    await dish.save();
    return ok(dish.model3d);
});

/**
 * Studio: re-processes the ORIGINAL model with the given settings (non-destructive).
 * body: { rotation: [x,y,z] deg, reference: { axis: 'width'|'height'|'keep', cm }, crop: { radiusCm, bottomCm, topCm } | null,
 *         quality: 'light'|'balanced'|'ultra' }   — or the legacy { realDiameterCm }.
 */
export const PUT = handler(async (request, { params }) => {
    const { restaurantId, user, access } = await requireManager({ write: true });
    const dish = await loadDish(params, restaurantId);
    if (!access.can3d) throw new HttpError(403, 'Les plats en 3D sont désactivés pour votre compte.');
    const m = dish.model3d || {};
    const source = m.originalGlb || m.glb;
    if (!source || m.status !== 'ready') throw new HttpError(400, 'Aucun modèle 3D à régler pour ce plat.');

    const body = await request.json();
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const reference = body.reference
        ? { axis: ['width', 'height', 'keep'].includes(body.reference.axis) ? body.reference.axis : 'width', cm: n(body.reference.cm) || null }
        : { axis: 'width', cm: n(body.realDiameterCm) || m.realDiameterCm || 26 };
    if (reference.axis !== 'keep' && !(reference.cm >= 1 && reference.cm <= 200)) throw new HttpError(400, 'Dimension entre 1 et 200 cm.');
    const rotation = Array.isArray(body.rotation) ? body.rotation.slice(0, 3).map((v) => Math.max(-360, Math.min(360, n(v)))) : (m.rotation || [0, 0, 0]);
    const crop = body.crop === null ? {} : body.crop
        ? { radiusCm: n(body.crop.radiusCm) || null, bottomCm: n(body.crop.bottomCm) || null, topCm: n(body.crop.topCm) || null }
        : (m.crop?.toObject?.() || m.crop || {});
    const quality = QUALITY[body.quality] ? body.quality : (m.quality || 'balanced');
    const owner = user._id.toString();

    const previousGlb = m.glb;
    const p = await processStoredModel(source, { rotation, reference: { ...reference, fallbackCm: m.realDiameterCm || 26 }, crop, quality }, { owner, name: dish.name });
    setModel(dish, {
        glb: p.glb, originalGlb: source, dimensions: p.dimensions, triangles: p.triangles,
        reference, rotation, crop, quality, realDiameterCm: p.dimensions.widthCm, poster: null, usdz: null,
    });
    await dish.save();
    if (previousGlb && previousGlb !== source) await deleteOwnedFile(previousGlb, owner);
    return ok(dish.model3d);
});

/** Removes the 3D model (captured photos are kept). */
export const DELETE = handler(async (request, { params }) => {
    const { restaurantId } = await requireManager({ write: true });
    const dish = await loadDish(params, restaurantId);
    setModel(dish, { glb: null, originalGlb: null, usdz: null, poster: null, taskId: null, provider: null, source: null, error: null, dimensions: null, status: 'none' });
    await dish.save();
    return ok(dish.model3d);
});
