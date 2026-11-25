"use client";

const CHUNK = 3.5 * 1024 * 1024;

async function postJson(url, body) {
    const res = await fetch(url, { method: 'POST', body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.error || `Erreur ${res.status}`);
    return json.data;
}

/**
 * Uploads a File/Blob and resolves to its URL ("/api/media/<id>").
 * Big files (3D scans) are sent in chunks so they pass serverless body-size limits.
 */
export async function uploadFile(file, { filename, onProgress } = {}) {
    const name = filename || file.name || 'file';
    if (file.size <= CHUNK) {
        const fd = new FormData();
        fd.append('file', file, name);
        const data = await postJson('/api/upload', fd);
        onProgress?.(1);
        return data.url;
    }
    const total = Math.ceil(file.size / CHUNK);
    const uploadId = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    let data;
    for (let index = 0; index < total; index++) {
        const fd = new FormData();
        fd.append('uploadId', uploadId);
        fd.append('index', String(index));
        fd.append('total', String(total));
        fd.append('filename', name);
        fd.append('contentType', file.type || '');
        fd.append('chunk', file.slice(index * CHUNK, (index + 1) * CHUNK), `${name}.part`);
        data = await postJson('/api/upload/chunk', fd);
        onProgress?.((index + 1) / total);
    }
    return data.url;
}

/** Downscales a photo (keeps uploads light and fast on mobile networks). */
export async function compressImage(source, { maxSize = 1600, quality = 0.85 } = {}) {
    const bitmap = source instanceof ImageBitmap ? source : await createImageBitmap(source);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}
