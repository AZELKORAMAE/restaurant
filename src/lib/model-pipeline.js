// Server-side 3D "studio" pipeline (glTF-Transform + meshoptimizer + sharp).
// Every model shown to customers goes through it, whatever its origin (photogrammetry scan,
// AI reconstruction, imported file, photo preview), so that it:
//   - stands upright, centred, with its base exactly on the table (y = 0),
//   - has its real size in metres (Scene Viewer / Quick Look read the file as-is),
//   - is cleaned of the table / background around the dish (cylindrical crop),
//   - is light enough for a phone: welded, deduplicated, simplified, textures ≤ 2048 px.
import { NodeIO, Node as GNode, Primitive } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { flatten, clearNodeTransform, transformMesh, compactPrimitive, weld, dedup, prune, simplify, normals } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

export const QUALITY = {
    light: { maxTriangles: 80_000, maxTexture: 1024, label: 'Léger (réseau lent)' },
    balanced: { maxTriangles: 200_000, maxTexture: 2048, label: 'Équilibré (recommandé)' },
    ultra: { maxTriangles: 400_000, maxTexture: 4096, label: 'Ultra (vitrine)' },
};

let ioPromise;
function getIO() {
    ioPromise ||= draco3d.createDecoderModule().then((decoder) =>
        new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': decoder }));
    return ioPromise;
}

// --- maths (column-major 4x4, same conventions as glTF / three.js) ---------------------------
const DEG = Math.PI / 180;

/** Rotation matrix from Euler angles in degrees, order XYZ (three.js default). */
export function eulerMatrix([rx = 0, ry = 0, rz = 0] = []) {
    const [a, b] = [Math.cos(rx * DEG), Math.sin(rx * DEG)];
    const [c, d] = [Math.cos(ry * DEG), Math.sin(ry * DEG)];
    const [e, f] = [Math.cos(rz * DEG), Math.sin(rz * DEG)];
    const ae = a * e, af = a * f, be = b * e, bf = b * f;
    // three.js Matrix4.makeRotationFromEuler (XYZ), converted to column-major
    return [
        c * e, af + be * d, bf - ae * d, 0,
        -c * f, ae - bf * d, be + af * d, 0,
        d, -b * c, a * c, 0,
        0, 0, 0, 1,
    ];
}

const scaleTranslate = (s, [tx, ty, tz]) => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, tx, ty, tz, 1];

// --- helpers ---------------------------------------------------------------------------------
function meshNodes(doc) {
    return doc.getRoot().listNodes().filter((n) => n.getMesh());
}

function uniqueMeshes(doc) {
    return [...new Set(meshNodes(doc).map((n) => n.getMesh()))];
}

/** Exact bounding box from the vertices (all node transforms are baked beforehand). */
function vertexBounds(doc) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    const v = [0, 0, 0];
    for (const mesh of uniqueMeshes(doc)) {
        for (const prim of mesh.listPrimitives()) {
            const pos = prim.getAttribute('POSITION');
            if (!pos) continue;
            const idx = prim.getIndices()?.getArray();
            const count = pos.getCount();
            const used = idx ? new Uint8Array(count) : null;
            if (idx) for (let i = 0; i < idx.length; i++) used[idx[i]] = 1;
            for (let i = 0; i < count; i++) {
                if (used && !used[i]) continue;
                pos.getElement(i, v);
                for (let a = 0; a < 3; a++) { if (v[a] < min[a]) min[a] = v[a]; if (v[a] > max[a]) max[a] = v[a]; }
            }
        }
    }
    return Number.isFinite(min[0]) ? { min, max } : null;
}

function dimsOf(b) {
    return { x: b.max[0] - b.min[0], y: b.max[1] - b.min[1], z: b.max[2] - b.min[2] };
}

function applyMatrix(doc, matrix) {
    for (const mesh of uniqueMeshes(doc)) transformMesh(mesh, matrix);
}

/**
 * Uniform scale + translation: centred on X/Z, base at y = 0, real size.
 * reference: { axis: 'width' | 'height' | 'keep', cm, fallbackCm }
 *   width  → the largest horizontal dimension (diameter of the plate) = cm
 *   height → the height of the dish = cm
 *   keep   → keep the file's own scale (metric scans), unless it is clearly not in metres
 */
function normalize(doc, reference) {
    const b = vertexBounds(doc);
    if (!b) throw new Error('Le modèle ne contient aucune géométrie.');
    const d = dimsOf(b);
    const footprint = Math.max(d.x, d.z);
    let s = 1;
    if (reference.axis === 'height' && reference.cm > 0 && d.y > 0) s = reference.cm / 100 / d.y;
    else if (reference.axis === 'width' && reference.cm > 0 && footprint > 0) s = reference.cm / 100 / footprint;
    else if (!(footprint >= 0.05 && footprint <= 1.2)) s = (reference.fallbackCm || 26) / 100 / footprint;
    const cx = (b.min[0] + b.max[0]) / 2;
    const cz = (b.min[2] + b.max[2]) / 2;
    applyMatrix(doc, scaleTranslate(s, [-cx * s, -b.min[1] * s, -cz * s]));
}

/** Keeps the triangles whose centre is inside the cylinder (radius around Y, above `bottom`, below `top`). */
function crop(doc, { radius, bottom = 0, top = null }) {
    const buffer = doc.getRoot().listBuffers()[0];
    const r2 = radius ? radius * radius : Infinity;
    const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0];
    let kept = 0;
    for (const mesh of uniqueMeshes(doc)) {
        for (const prim of mesh.listPrimitives()) {
            if (prim.getMode() !== Primitive.Mode.TRIANGLES) continue;
            const pos = prim.getAttribute('POSITION');
            const count = pos.getCount();
            const src = prim.getIndices()?.getArray() || Uint32Array.from({ length: count }, (_, i) => i);
            const out = [];
            for (let i = 0; i + 2 < src.length; i += 3) {
                pos.getElement(src[i], a); pos.getElement(src[i + 1], b); pos.getElement(src[i + 2], c);
                const x = (a[0] + b[0] + c[0]) / 3, y = (a[1] + b[1] + c[1]) / 3, z = (a[2] + b[2] + c[2]) / 3;
                if (x * x + z * z <= r2 && y >= bottom && (top == null || y <= top)) out.push(src[i], src[i + 1], src[i + 2]);
            }
            if (!out.length) { prim.dispose(); continue; }
            kept += out.length / 3;
            const Arr = count > 65535 ? Uint32Array : Uint16Array;
            const indices = doc.createAccessor().setType('SCALAR').setArray(Arr.from(out)).setBuffer(buffer);
            prim.setIndices(indices);
            compactPrimitive(prim);
        }
    }
    if (!kept) throw new Error('Le recadrage a supprimé tout le modèle. Élargissez la zone conservée.');
}

function triangleCount(doc) {
    let n = 0;
    for (const mesh of uniqueMeshes(doc)) {
        for (const prim of mesh.listPrimitives()) {
            const idx = prim.getIndices();
            n += Math.floor((idx ? idx.getCount() : prim.getAttribute('POSITION')?.getCount() || 0) / 3);
        }
    }
    return n;
}

/** Resizes textures and re-encodes them (JPEG, or PNG when transparency is needed). */
async function optimizeTextures(doc, maxSize) {
    const root = doc.getRoot();
    const alphaTextures = new Set(root.listMaterials()
        .filter((m) => m.getAlphaMode() !== 'OPAQUE')
        .map((m) => m.getBaseColorTexture()).filter(Boolean));

    for (const tex of root.listTextures()) {
        const image = tex.getImage();
        const mime = tex.getMimeType();
        if (!image || mime === 'image/ktx2') continue;
        try {
            const keepAlpha = alphaTextures.has(tex);
            let pipe = sharp(Buffer.from(image)).resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true });
            pipe = keepAlpha ? pipe.png({ compressionLevel: 9 }) : pipe.jpeg({ quality: 90, mozjpeg: true });
            tex.setImage(new Uint8Array(await pipe.toBuffer())).setMimeType(keepAlpha ? 'image/png' : 'image/jpeg');
            const uri = tex.getURI();
            if (uri) tex.setURI(uri.replace(/\.\w+$/, keepAlpha ? '.png' : '.jpg'));
        } catch (e) {
            console.warn('texture skipped:', e.message);
        }
    }
    // WebP textures were converted: the extension is no longer needed.
    root.listExtensionsUsed().find((e) => e.extensionName === 'EXT_texture_webp')?.dispose();
}

/**
 * @param {Buffer|Uint8Array} input  GLB file
 * @param {object} opts
 *   rotation  [x, y, z] degrees, applied first (to put a scan upright)
 *   reference { axis: 'width'|'height'|'keep', cm, fallbackCm }
 *   crop      { radiusCm, bottomCm, topCm } in the normalized space (optional)
 *   quality   'light' | 'balanced' | 'ultra'
 * @returns {{ glb: Buffer, dimensions: { widthCm, depthCm, heightCm }, triangles: number }}
 */
export async function processModel(input, opts = {}) {
    const io = await getIO();
    const doc = await io.readBinary(new Uint8Array(input));
    const root = doc.getRoot();
    const q = QUALITY[opts.quality] || QUALITY.balanced;

    // Keep one static scene: no animations, cameras, lights or extra scenes.
    const scene = root.getDefaultScene() || root.listScenes()[0];
    if (!scene) throw new Error('Le fichier ne contient aucune scène.');
    for (const s of root.listScenes()) if (s !== scene) s.dispose();
    root.setDefaultScene(scene);
    for (const anim of root.listAnimations()) anim.dispose();
    for (const node of root.listNodes()) { node.setCamera(null); node.setSkin(null); }
    for (const skin of root.listSkins()) skin.dispose();
    root.listExtensionsUsed().find((e) => e.extensionName === 'KHR_lights_punctual')?.dispose();
    root.listExtensionsUsed().find((e) => e.extensionName === 'KHR_draco_mesh_compression')?.dispose();

    // Drop points/lines (photogrammetry noise) and bake every transform into the vertices.
    for (const mesh of root.listMeshes()) {
        for (const prim of mesh.listPrimitives()) if (prim.getMode() !== Primitive.Mode.TRIANGLES) prim.dispose();
    }
    await doc.transform(flatten());
    for (const node of meshNodes(doc)) {
        const owners = node.getMesh().listParents().filter((p) => p instanceof GNode);
        if (owners.length > 1 && owners[0] !== node) node.setMesh(node.getMesh().clone());
    }
    for (const node of root.listNodes()) clearNodeTransform(node);

    if (opts.rotation?.some((v) => v)) applyMatrix(doc, eulerMatrix(opts.rotation));

    const reference = opts.reference || { axis: 'keep', fallbackCm: 26 };
    normalize(doc, reference);

    if (opts.crop && (opts.crop.radiusCm || opts.crop.bottomCm || opts.crop.topCm)) {
        crop(doc, {
            radius: opts.crop.radiusCm ? opts.crop.radiusCm / 100 : null,
            bottom: (opts.crop.bottomCm || 0) / 100,
            top: opts.crop.topCm ? opts.crop.topCm / 100 : null,
        });
        const kept = dimsOf(vertexBounds(doc));
        if (kept.y < 0.003 || Math.max(kept.x, kept.z) < 0.01) {
            throw new Error('Le recadrage ne laisse qu’une surface plate : agrandissez le rayon conservé ou baissez la coupe.');
        }
        // The dish itself now defines the size (the table around it is gone).
        normalize(doc, reference.axis === 'keep' ? { axis: 'keep', fallbackCm: reference.fallbackCm } : reference);
    }

    await doc.transform(
        dedup(),
        weld(),
        normals({ overwrite: false }),
    );
    const tris = triangleCount(doc);
    if (tris > q.maxTriangles) {
        await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: q.maxTriangles / tris, error: 0.004 }));
    }
    await doc.transform(prune());
    await optimizeTextures(doc, q.maxTexture);

    const d = dimsOf(vertexBounds(doc));
    const glb = Buffer.from(await io.writeBinary(doc));
    return {
        glb,
        triangles: triangleCount(doc),
        dimensions: {
            widthCm: Math.round(Math.max(d.x, d.z) * 1000) / 10,
            depthCm: Math.round(Math.min(d.x, d.z) * 1000) / 10,
            heightCm: Math.round(d.y * 1000) / 10,
        },
    };
}

/** Reads a model that may come as .glb, or as .gltf + resources (e.g. from a zip). */
export async function toGlb(files) {
    const io = await getIO();
    const glbName = Object.keys(files).find((n) => n.toLowerCase().endsWith('.glb'));
    if (glbName) return Buffer.from(files[glbName]);
    const gltfName = Object.keys(files).find((n) => n.toLowerCase().endsWith('.gltf'));
    if (!gltfName) throw new Error('Aucun fichier GLB/glTF trouvé.');
    const dir = gltfName.includes('/') ? gltfName.slice(0, gltfName.lastIndexOf('/') + 1) : '';
    const resources = {};
    for (const [name, data] of Object.entries(files)) if (name.startsWith(dir) && name !== gltfName) resources[name.slice(dir.length)] = new Uint8Array(data);
    const doc = await io.readJSON({ json: JSON.parse(Buffer.from(files[gltfName]).toString('utf8')), resources });
    return Buffer.from(await io.writeBinary(doc));
}
