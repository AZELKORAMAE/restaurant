import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import dbConnect from '@/lib/db';

const BUCKET = 'files';

export async function getBucket() {
    await dbConnect();
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });
}

/** Stores a Buffer (or an iterable of Buffers) in GridFS and returns the new file id (string). */
export async function saveFile({ filename, contentType, data, metadata = {} }) {
    const bucket = await getBucket();
    const upload = bucket.openUploadStream(filename || 'file', {
        metadata: { ...metadata, contentType },
    });
    const source = Buffer.isBuffer(data) ? Readable.from([data]) : Readable.from(data);
    await new Promise((resolve, reject) => {
        source.pipe(upload).on('finish', resolve).on('error', reject);
    });
    return upload.id.toString();
}

export async function findFile(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    const bucket = await getBucket();
    const [file] = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).limit(1).toArray();
    return file ? { bucket, file } : null;
}

export async function readFileBuffer(id) {
    const found = await findFile(id);
    if (!found) return null;
    const chunks = [];
    for await (const chunk of found.bucket.openDownloadStream(found.file._id)) chunks.push(chunk);
    return { buffer: Buffer.concat(chunks), contentType: found.file.metadata?.contentType, file: found.file };
}

export async function deleteFile(id) {
    const found = await findFile(id);
    if (found) await found.bucket.delete(found.file._id);
}

/** "/api/media/<id>" -> "<id>" */
export function mediaIdFromUrl(url) {
    const m = typeof url === 'string' && url.match(/\/api\/media\/([a-f0-9]{24})/i);
    return m ? m[1] : null;
}

export function guessContentType(filename = '', fallback = 'application/octet-stream') {
    const ext = filename.toLowerCase().split('.').pop();
    return {
        glb: 'model/gltf-binary',
        gltf: 'model/gltf+json',
        usdz: 'model/vnd.usdz+zip',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif',
    }[ext] || fallback;
}
