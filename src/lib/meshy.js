// Photo → 3D reconstruction through the Meshy "multi-image to 3D" API.
// Enabled only when MESHY_API_KEY is set. Docs: https://docs.meshy.ai/api/multi-image-to-3d
const BASE = 'https://api.meshy.ai/openapi/v1/multi-image-to-3d';

export const meshyEnabled = () => Boolean(process.env.MESHY_API_KEY);

async function call(path, init = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
        cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || `Meshy a répondu ${res.status}`);
    return json;
}

/** images: array of data URIs (1 to 4, taken from different angles). Returns the task id. */
export async function startReconstruction(images) {
    const json = await call('', {
        method: 'POST',
        body: JSON.stringify({
            image_urls: images.slice(0, 4),
            ai_model: process.env.MESHY_AI_MODEL || 'latest',
            should_texture: true,
            enable_pbr: true,
            target_formats: ['glb', 'usdz'],
        }),
    });
    return json.result;
}

/** Returns { status: PENDING|IN_PROGRESS|SUCCEEDED|FAILED|CANCELED, progress, glb, usdz, thumbnail, error } */
export async function getReconstruction(taskId) {
    const t = await call(`/${encodeURIComponent(taskId)}`);
    return {
        status: t.status,
        progress: t.progress ?? 0,
        glb: t.model_urls?.glb,
        usdz: t.model_urls?.usdz,
        thumbnail: t.thumbnail_url,
        error: t.task_error?.message || null,
    };
}

/** Picks `n` evenly spaced items, so the 4 images sent cover the whole tour of the dish. */
export function spread(list, n) {
    if (list.length <= n) return list;
    return Array.from({ length: n }, (_, i) => list[Math.round((i * (list.length - 1)) / (n - 1))]);
}
