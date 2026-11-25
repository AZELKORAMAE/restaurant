"use client";
// Builds a real-size 3D "plated dish" from a single photo, in the browser (three.js):
// a porcelain plate + a domed food layer textured with the centre of the photo.
// It is a quick preview so every dish can be placed on the table in AR; a real scan looks better.

async function loadImage(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    return img;
}

/** Square crop of the photo centre, with a soft circular edge. */
function foodTexture(THREE, img, size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const side = Math.min(img.naturalWidth, img.naturalHeight) * 0.9;
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    // feather the border so the food blends into the plate
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.36, size / 2, size / 2, size * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(250,248,244,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    return tex;
}

/**
 * @param {string} photoUrl  dish photo
 * @param {object} opts      diameterCm: plate diameter, heightCm: food height
 * @returns {Promise<Blob>}  binary glTF (.glb), already in metres
 */
export async function generatePlateGlb(photoUrl, { diameterCm = 26, heightCm = 3.5 } = {}) {
    const THREE = await import('three');
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

    const R = diameterCm / 200; // radius in metres
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    group.name = 'plated-dish';
    scene.add(group);

    // Plate: lathe profile (foot, well, rim), in metres.
    const profile = [
        [0, 0.004], [R * 0.45, 0.004], [R * 0.5, 0], [R * 0.56, 0.002], [R * 0.62, 0.006],
        [R * 0.78, 0.012], [R * 0.97, 0.018], [R, 0.017], [R * 0.99, 0.0155], [R * 0.79, 0.0105],
        [R * 0.64, 0.0075], [R * 0.6, 0.0075], [0, 0.0075],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const plateGeo = new THREE.LatheGeometry(profile, 96);
    plateGeo.computeVertexNormals();
    const porcelain = new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.22, metalness: 0 });
    const plate = new THREE.Mesh(plateGeo, porcelain);
    plate.name = 'plate';
    group.add(plate);

    // Food: a flattened spherical cap with a top-down (planar) projection of the photo.
    const img = await loadImage(photoUrl);
    const foodR = R * 0.62;
    const h = heightCm / 100;
    const cap = new THREE.SphereGeometry(1, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const pos = cap.attributes.position;
    const uv = cap.attributes.uv;
    const rimY = Math.cos(Math.PI / 2.2);
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const ny = (y - rimY) / (1 - rimY); // 0 at the rim, 1 at the top
        pos.setXYZ(i, x * foodR, 0.0075 + Math.pow(Math.max(ny, 0), 0.6) * h, z * foodR);
        uv.setXY(i, x * 0.5 + 0.5, z * 0.5 + 0.5);
    }
    cap.computeVertexNormals();
    const food = new THREE.Mesh(cap, new THREE.MeshStandardMaterial({ map: foodTexture(THREE, img), roughness: 0.55, metalness: 0 }));
    food.name = 'food';
    group.add(food);

    const exporter = new GLTFExporter();
    const glb = await exporter.parseAsync(scene, { binary: true, onlyVisible: true, maxTextureSize: 1024 });
    return new Blob([glb], { type: 'model/gltf-binary' });
}
