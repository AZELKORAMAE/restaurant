// Photogrammetry through the KIRI Engine API: real 3D scans reconstructed from 20 to 300 photos,
// with automatic object masking (the table and the room are removed) and 4K textures.
// Enabled when KIRI_API_KEY is set. Docs: https://docs.kiriengine.app
import { unzipSync } from 'fflate';

const BASE = 'https://api.kiriengine.app/api/v1/open';
export const KIRI_MIN_PHOTOS = 20;
export const kiriEnabled = () => Boolean(process.env.KIRI_API_KEY);

async function call(path, init = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${process.env.KIRI_API_KEY}`, ...(init.headers || {}) },
        cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.code !== 0) throw new Error(json?.msg || `KIRI Engine a répondu ${res.status}`);
    return json.data;
}

/** photos: [{ buffer, contentType, filename }] — returns the task id ("serialize"). */
export async function startKiriScan(photos) {
    const form = new FormData();
    for (const p of photos) form.append('imagesFiles', new Blob([p.buffer], { type: p.contentType || 'image/jpeg' }), p.filename);
    form.append('modelQuality', '0');      // High
    form.append('textureQuality', '0');    // 4K (our pipeline brings it down to the chosen quality)
    form.append('isMask', '1');            // automatic object masking: keeps the dish only
    form.append('textureSmoothing', '0');  // keep the real texture detail
    form.append('fileFormat', 'glb');
    const data = await call('/photo/image', { method: 'POST', body: form });
    return data.serialize;
}

const STATUS = { '-1': 'uploading', 0: 'processing', 1: 'failed', 2: 'done', 3: 'queued', 4: 'expired' };

export async function getKiriScan(serialize) {
    const data = await call(`/model/getStatus?serialize=${encodeURIComponent(serialize)}`);
    return STATUS[data.status] || 'processing';
}

/** Downloads the finished model; returns { files } (zip content: name → Uint8Array). */
export async function downloadKiriScan(serialize) {
    const data = await call(`/model/getModelZip?serialize=${encodeURIComponent(serialize)}`);
    const res = await fetch(data.modelUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Téléchargement du scan impossible (${res.status}).`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    // The service returns a zip; accept a bare GLB too.
    if (bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46) return { 'model.glb': bytes };
    return unzipSync(bytes);
}
