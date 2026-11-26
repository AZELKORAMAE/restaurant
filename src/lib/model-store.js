import { readFileBuffer, saveFile, mediaIdFromUrl, deleteFile, findFile } from '@/lib/gridfs';
import { HttpError } from '@/lib/api';

/**
 * Runs the studio pipeline on a stored model and stores the result.
 * Returns the fields to set on dish.model3d.
 */
export async function processStoredModel(sourceUrl, settings, { owner, name = 'plat' } = {}) {
    const id = mediaIdFromUrl(sourceUrl);
    const f = id && await readFileBuffer(id);
    if (!f) throw new HttpError(400, 'Fichier 3D introuvable.');
    return processBuffer(f.buffer, settings, { owner, name });
}

export async function processBuffer(buffer, settings, { owner, name = 'plat' } = {}) {
    let result;
    try {
        // Chargé seulement quand un modèle 3D est traité : les plats et leurs photos ne dépendent pas des outils 3D
        const { processModel } = await import('@/lib/model-pipeline');
        result = await processModel(buffer, settings);
    } catch (e) {
        const invalid = /Invalid|magic|JSON|glTF|header/i.test(e.message);
        throw new HttpError(400, invalid ? 'Ce fichier n’est pas un modèle GLB valide.' : e.message);
    }
    const fileId = await saveFile({
        filename: `${name}.glb`,
        contentType: 'model/gltf-binary',
        data: result.glb,
        metadata: { owner, processed: true },
    });
    return { glb: `/api/media/${fileId}`, dimensions: result.dimensions, triangles: result.triangles };
}

/** Deletes a stored file if it belongs to this account (never another restaurant's file). */
export async function deleteOwnedFile(url, owner) {
    const id = mediaIdFromUrl(url);
    if (!id) return;
    const found = await findFile(id);
    if (found && (found.file.metadata?.owner === owner || owner === 'superadmin')) await deleteFile(id);
}
