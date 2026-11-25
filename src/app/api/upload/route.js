import { handler, ok, requireAccount, HttpError } from '@/lib/api';
import { saveFile, guessContentType } from '@/lib/gridfs';

const MAX = 25 * 1024 * 1024;

// Single-request upload (photos). Large 3D files go through /api/upload/chunk.
export const POST = handler(async (request) => {
    const account = await requireAccount();
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') throw new HttpError(400, 'Aucun fichier.');
    if (file.size > MAX) throw new HttpError(413, 'Fichier trop volumineux (25 Mo max).');

    const contentType = file.type || guessContentType(file.name);
    const id = await saveFile({
        filename: file.name,
        contentType,
        data: Buffer.from(await file.arrayBuffer()),
        metadata: { owner: account.id },
    });
    return ok({ url: `/api/media/${id}`, id });
});
