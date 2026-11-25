import { handler, ok, requireAccount, HttpError } from '@/lib/api';
import { saveFile, guessContentType } from '@/lib/gridfs';
import UploadChunk from '@/models/UploadChunk';

const MAX_CHUNK = 4 * 1024 * 1024;   // stays under serverless request-body limits
const MAX_CHUNKS = 50;               // 200 MB max per file

/**
 * Chunked upload. The browser sends the file in ≤4 MB parts:
 *   form fields: uploadId, index, total, filename, contentType, chunk (Blob)
 * When the last part arrives the parts are streamed into GridFS and the URL is returned.
 */
export const POST = handler(async (request) => {
    const account = await requireAccount();
    const form = await request.formData();
    const uploadId = String(form.get('uploadId') || '');
    const index = parseInt(form.get('index'), 10);
    const total = parseInt(form.get('total'), 10);
    const chunk = form.get('chunk');

    if (!/^[a-zA-Z0-9-]{8,64}$/.test(uploadId)) throw new HttpError(400, 'uploadId invalide.');
    if (!(total >= 1 && total <= MAX_CHUNKS) || !(index >= 0 && index < total)) throw new HttpError(400, 'Index invalide.');
    if (!chunk || typeof chunk === 'string' || chunk.size > MAX_CHUNK) throw new HttpError(400, 'Morceau invalide.');

    await UploadChunk.updateOne(
        { uploadId, index },
        { $set: { owner: account.id, data: Buffer.from(await chunk.arrayBuffer()) } },
        { upsert: true }
    );

    const received = await UploadChunk.countDocuments({ uploadId, owner: account.id });
    if (received < total) return ok({ received, total });

    const filename = String(form.get('filename') || 'file').slice(0, 200);
    const contentType = String(form.get('contentType') || '') || guessContentType(filename);

    async function* parts() {
        for (let i = 0; i < total; i++) {
            const part = await UploadChunk.findOne({ uploadId, index: i, owner: account.id });
            if (!part) throw new HttpError(400, `Morceau ${i} manquant.`);
            yield part.data;
        }
    }
    const id = await saveFile({ filename, contentType, data: parts(), metadata: { owner: account.id } });
    await UploadChunk.deleteMany({ uploadId });
    return ok({ url: `/api/media/${id}`, id, done: true });
});
