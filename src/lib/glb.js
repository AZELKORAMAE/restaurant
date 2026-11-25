// Minimal GLB (binary glTF 2.0) tools, no dependencies.
// Used to give AI-generated models their real-world size: AR viewers (Scene Viewer, Quick Look)
// read the file as-is, so the scale must be baked into the file itself.

const MAGIC = 0x46546c67; // "glTF"
const JSON_CHUNK = 0x4e4f534a;

export function parseGlb(buffer) {
    if (buffer.readUInt32LE(0) !== MAGIC) throw new Error('Fichier GLB invalide.');
    const jsonLength = buffer.readUInt32LE(12);
    if (buffer.readUInt32LE(16) !== JSON_CHUNK) throw new Error('GLB sans en-tête JSON.');
    const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
    const rest = buffer.subarray(20 + jsonLength); // binary chunk(s), kept untouched
    return { json, rest };
}

export function buildGlb(json, rest) {
    let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
    const pad = (4 - (jsonBuf.length % 4)) % 4;
    if (pad) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad, 0x20)]);
    const header = Buffer.alloc(20);
    header.writeUInt32LE(MAGIC, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(20 + jsonBuf.length + rest.length, 8);
    header.writeUInt32LE(jsonBuf.length, 12);
    header.writeUInt32LE(JSON_CHUNK, 16);
    return Buffer.concat([header, jsonBuf, rest]);
}

// --- 4x4 column-major matrices -------------------------------------------------------------
const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a, b) {
    const out = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return out;
}

function fromTRS(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
    const [x, y, z, w] = q;
    const [sx, sy, sz] = s;
    return [
        (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
        2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
        2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
        t[0], t[1], t[2], 1,
    ];
}

const apply = (m, [x, y, z]) => [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
];

/** World-space bounding box of the default scene, from accessor min/max (required by the spec for POSITION). */
export function sceneBounds(json) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    const visit = (index, parent) => {
        const node = json.nodes?.[index];
        if (!node) return;
        const local = node.matrix || fromTRS(node.translation, node.rotation, node.scale);
        const world = multiply(parent, local);
        const mesh = node.mesh !== undefined ? json.meshes?.[node.mesh] : null;
        for (const prim of mesh?.primitives || []) {
            const acc = json.accessors?.[prim.attributes?.POSITION];
            if (!acc?.min || !acc?.max) continue;
            for (let i = 0; i < 8; i++) {
                const p = apply(world, [i & 1 ? acc.max[0] : acc.min[0], i & 2 ? acc.max[1] : acc.min[1], i & 4 ? acc.max[2] : acc.min[2]]);
                for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], p[a]); max[a] = Math.max(max[a], p[a]); }
            }
        }
        for (const child of node.children || []) visit(child, world);
    };
    const scene = json.scenes?.[json.scene ?? 0];
    for (const n of scene?.nodes || []) visit(n, identity());
    return Number.isFinite(min[0]) ? { min, max } : null;
}

/**
 * Rescales the model so its footprint (largest of width/depth) equals `diameterMeters`,
 * centres it and puts its bottom at y = 0, so it sits on the table in AR.
 */
export function normalizeGlb(buffer, diameterMeters) {
    const { json, rest } = parseGlb(buffer);
    const b = sceneBounds(json);
    if (!b) return buffer;
    const footprint = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]);
    if (!(footprint > 0)) return buffer;
    const s = diameterMeters / footprint;
    const cx = (b.min[0] + b.max[0]) / 2;
    const cz = (b.min[2] + b.max[2]) / 2;

    const sceneIndex = json.scene ?? 0;
    const scene = json.scenes[sceneIndex];
    json.nodes ||= [];
    json.nodes.push({
        name: 'real-size-root',
        translation: [-cx * s, -b.min[1] * s, -cz * s],
        scale: [s, s, s],
        children: scene.nodes || [],
    });
    scene.nodes = [json.nodes.length - 1];
    return buildGlb(json, rest);
}
