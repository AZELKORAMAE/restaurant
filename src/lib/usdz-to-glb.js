"use client";

/**
 * Converts an iPhone Object Capture scan (.usdz) into a binary glTF (.glb), in the browser.
 * The GLB is what the menu shows in the page and on Android (Scene Viewer);
 * the original USDZ is kept for iPhone Quick Look.
 *
 * @param {File|Blob} file  the .usdz exported by Reality Composer / Object Capture
 * @returns {Promise<Blob>} model/gltf-binary
 */
export async function usdzToGlb(file) {
    const { USDLoader } = await import('three/examples/jsm/loaders/USDLoader.js');
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

    const scene = new USDLoader().parse(await file.arrayBuffer());
    let meshes = 0;
    scene.traverse((o) => { if (o.isMesh) meshes++; });
    if (!meshes) throw new Error('Aucun objet 3D trouvé dans ce fichier USDZ.');
    await texturesLoaded(scene);

    // Object Capture exports in metres with large photo textures: keep them sharp but reasonable
    const glb = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, maxTextureSize: 2048 });
    return new Blob([glb], { type: 'model/gltf-binary' });
}

/** The loader decodes the scan's photo textures asynchronously: wait until every image is ready (20 s max). */
async function texturesLoaded(scene, timeoutMs = 20000) {
    const textures = new Set();
    scene.traverse((o) => {
        for (const mat of [].concat(o.material || [])) {
            for (const v of Object.values(mat)) if (v?.isTexture) textures.add(v);
        }
    });
    const ready = (t) => {
        const img = t.image;
        if (!img) return false;
        if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) return img.complete && img.naturalWidth > 0;
        return (img.width || 0) > 0;
    };
    const start = Date.now();
    while ([...textures].some((t) => !ready(t))) {
        if (Date.now() - start > timeoutMs) {
            // Texture illisible : on l'enlève plutôt que de faire échouer la conversion
            scene.traverse((o) => {
                for (const mat of [].concat(o.material || [])) {
                    for (const [k, v] of Object.entries(mat)) if (v?.isTexture && !ready(v)) mat[k] = null;
                }
            });
            break;
        }
        await new Promise((r) => setTimeout(r, 100));
    }
}
