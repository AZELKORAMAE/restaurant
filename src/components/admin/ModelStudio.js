"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCw, RotateCcw, Ruler, Scissors, Sparkles, Loader2, Check, Eye, Grid3x3, Undo2 } from 'lucide-react';
import { uploadFile } from '@/lib/upload-client';

const QUALITIES = [
    ['light', 'Léger', 'Réseau lent · 80k triangles · textures 1K'],
    ['balanced', 'Équilibré', 'Recommandé · 200k triangles · textures 2K'],
    ['ultra', 'Ultra', 'Vitrine · 400k triangles · textures 4K'],
];
const DRACO = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
const round1 = (v) => Math.round(v * 10) / 10;

/**
 * 3D studio for the manager. Live preview (three.js) of exactly what the server pipeline will do:
 *   1. rotation (put the scan upright / level it)
 *   2. real size (by width or height)
 *   3. crop (remove the table and the background around the dish)
 * "Appliquer" sends the settings to the server, which re-processes the ORIGINAL model (non-destructive),
 * then a poster image is rendered here for instant display in the menu.
 */
export default function ModelStudio({ dishId, model3d, onClose, onApplied }) {
    const mountRef = useRef(null);
    const ctx = useRef({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');
    const [rotation, setRotation] = useState(() => (model3d.rotation?.length === 3 ? model3d.rotation.map(Number) : [0, 0, 0]));
    const [axis, setAxis] = useState(model3d.reference?.axis || (model3d.source === 'scan' ? 'keep' : 'width'));
    const [cm, setCm] = useState(model3d.reference?.cm || model3d.realDiameterCm || 26);
    const [cropOn, setCropOn] = useState(Boolean(model3d.crop?.radiusCm || model3d.crop?.bottomCm));
    const [radiusCm, setRadiusCm] = useState(model3d.crop?.radiusCm || 0);
    const [bottomCm, setBottomCm] = useState(model3d.crop?.bottomCm || 0);
    const [quality, setQuality] = useState(model3d.quality || 'balanced');
    const [dims, setDims] = useState(null);       // before crop (cm)
    const [finalDims, setFinalDims] = useState(null); // estimated result (cm)
    const [guides, setGuides] = useState(true);

    const source = model3d.originalGlb || model3d.glb;

    // ---------- three.js scene ----------
    useEffect(() => {
        let disposed = false;
        let raf;
        (async () => {
            const THREE = await import('three');
            const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
            const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
            const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
            const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
            if (disposed) return;
            const mount = mountRef.current;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(mount.clientWidth, mount.clientHeight);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.NeutralToneMapping;
            renderer.localClippingEnabled = true;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            mount.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const pmrem = new THREE.PMREMGenerator(renderer);
            scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

            const camera = new THREE.PerspectiveCamera(30, mount.clientWidth / mount.clientHeight, 0.005, 50);
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.maxPolarAngle = Math.PI * 0.49;

            const key = new THREE.DirectionalLight(0xffffff, 1.6);
            key.position.set(0.6, 1.2, 0.8);
            key.castShadow = true;
            key.shadow.mapSize.set(2048, 2048);
            key.shadow.radius = 6;
            scene.add(key, new THREE.HemisphereLight(0xffffff, 0xe9e2d6, 0.5));
            const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.22 }));
            shadowPlane.rotation.x = -Math.PI / 2;
            shadowPlane.receiveShadow = true;
            scene.add(shadowPlane);

            const grid = new THREE.GridHelper(1, 20, 0xc8b99f, 0xe5ddd0); // 5 cm squares
            scene.add(grid);

            // norm (scale + centre) → pivot (rotation) → model
            const norm = new THREE.Group();
            const pivot = new THREE.Group();
            norm.add(pivot);
            scene.add(norm);

            // crop guides
            const cropGroup = new THREE.Group();
            const ringMat = new THREE.LineBasicMaterial({ color: 0xd99a1e });
            const ringGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 129 }, (_, i) => {
                const t = (i / 128) * Math.PI * 2;
                return new THREE.Vector3(Math.cos(t), 0, Math.sin(t));
            }));
            const ringBottom = new THREE.Line(ringGeo, ringMat);
            const ringTop = new THREE.Line(ringGeo, ringMat);
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0xf0b429, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
            cropGroup.add(ringBottom, ringTop, cyl);
            scene.add(cropGroup);

            const loader = new GLTFLoader();
            const draco = new DRACOLoader().setDecoderPath(DRACO);
            loader.setDRACOLoader(draco);

            let gltf;
            try {
                gltf = await loader.loadAsync(source);
            } catch (e) {
                if (!disposed) { setError('Impossible de charger le modèle : ' + e.message); setLoading(false); }
                return;
            }
            if (disposed) return;
            const model = gltf.scene;
            const clipMaterials = [];
            model.traverse((o) => {
                if (o.isMesh) {
                    o.castShadow = true;
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach((m) => { m.clipShadows = true; clipMaterials.push(m); });
                }
            });
            pivot.add(model);

            const resize = () => {
                renderer.setSize(mount.clientWidth, mount.clientHeight);
                camera.aspect = mount.clientWidth / mount.clientHeight;
                camera.updateProjectionMatrix();
            };
            window.addEventListener('resize', resize);
            const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
            loop();

            ctx.current = { THREE, renderer, scene, camera, controls, norm, pivot, model, clipMaterials, cropGroup, ringBottom, ringTop, cyl, grid, shadowPlane, key, resize, framed: false };
            setLoading(false);
        })();
        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            const c = ctx.current;
            if (c.renderer) {
                window.removeEventListener('resize', c.resize);
                c.controls.dispose();
                c.renderer.dispose();
                c.renderer.domElement.remove();
            }
            ctx.current = {};
        };
    }, [source]);

    // ---------- apply settings to the preview (same maths as the server pipeline) ----------
    const update = useCallback(() => {
        const c = ctx.current;
        if (!c.model) return;
        const { THREE, norm, pivot, model } = c;
        const D = Math.PI / 180;
        pivot.rotation.set(rotation[0] * D, rotation[1] * D, rotation[2] * D, 'XYZ');
        norm.position.set(0, 0, 0);
        norm.scale.setScalar(1);
        norm.updateMatrixWorld(true);

        const b = new THREE.Box3().setFromObject(pivot, true);
        const size = b.getSize(new THREE.Vector3());
        const footprint = Math.max(size.x, size.z);
        let s = 1;
        if (axis === 'height' && cm > 0 && size.y > 0) s = cm / 100 / size.y;
        else if (axis === 'width' && cm > 0 && footprint > 0) s = cm / 100 / footprint;
        else if (!(footprint >= 0.05 && footprint <= 1.2)) s = (model3d.realDiameterCm || 26) / 100 / footprint;
        const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
        norm.scale.setScalar(s);
        norm.position.set(-cx * s, -b.min.y * s, -cz * s);
        norm.updateMatrixWorld(true);

        const W = footprint * s, H = size.y * s;
        setDims({ widthCm: round1(W * 100), depthCm: round1(Math.min(size.x, size.z) * s * 100), heightCm: round1(H * 100) });

        // Crop: clipping planes (bottom + 24-sided prism ≈ cylinder) and visual guides
        const r = (radiusCm || (W * 100) / 2) / 100;
        const bottom = (bottomCm || 0) / 100;
        const planes = [];
        if (cropOn) {
            planes.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -bottom));
            for (let i = 0; i < 24; i++) {
                const t = (i / 24) * Math.PI * 2;
                planes.push(new THREE.Plane(new THREE.Vector3(-Math.cos(t), 0, -Math.sin(t)), r));
            }
        }
        c.clipMaterials.forEach((m) => { m.clippingPlanes = planes; m.needsUpdate = true; });
        c.cropGroup.visible = cropOn;
        c.ringBottom.scale.set(r, 1, r); c.ringBottom.position.y = bottom + 0.0005;
        c.ringTop.scale.set(r, 1, r); c.ringTop.position.y = Math.max(H, bottom) + 0.002;
        c.cyl.scale.set(r, Math.max(H - bottom, 0.001), r); c.cyl.position.y = bottom + (H - bottom) / 2;
        c.grid.visible = guides;
        c.shadowPlane.position.y = cropOn ? bottom : 0;

        // Estimated result after crop + re-scaling: whole triangles kept by their centre, like the server
        if (cropOn) {
            const a = new THREE.Vector3(), b2 = new THREE.Vector3(), c3 = new THREE.Vector3();
            const min = new THREE.Vector3(Infinity, Infinity, Infinity), max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
            model.traverse((o) => {
                if (!o.isMesh) return;
                const pos = o.geometry.attributes.position;
                const index = o.geometry.index;
                const triCount = Math.floor((index ? index.count : pos.count) / 3);
                const step = Math.max(1, Math.floor(triCount / 80000));
                for (let t = 0; t < triCount; t += step) {
                    const i0 = index ? index.getX(t * 3) : t * 3, i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1, i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
                    a.fromBufferAttribute(pos, i0).applyMatrix4(o.matrixWorld);
                    b2.fromBufferAttribute(pos, i1).applyMatrix4(o.matrixWorld);
                    c3.fromBufferAttribute(pos, i2).applyMatrix4(o.matrixWorld);
                    const x = (a.x + b2.x + c3.x) / 3, y = (a.y + b2.y + c3.y) / 3, z = (a.z + b2.z + c3.z) / 3;
                    if (x * x + z * z <= r * r && y >= bottom) { min.min(a).min(b2).min(c3); max.max(a).max(b2).max(c3); }
                }
            });
            if (Number.isFinite(min.x)) {
                const sz = max.clone().sub(min);
                const fp = Math.max(sz.x, sz.z);
                let k = 1;
                if (axis === 'height' && cm > 0 && sz.y > 0) k = cm / 100 / sz.y;
                else if (axis === 'width' && cm > 0 && fp > 0) k = cm / 100 / fp;
                setFinalDims({ widthCm: round1(fp * k * 100), depthCm: round1(Math.min(sz.x, sz.z) * k * 100), heightCm: round1(sz.y * k * 100) });
            } else setFinalDims(null);
        } else setFinalDims(null);

        // First framing of the camera
        if (!c.framed) {
            const radius = Math.max(W, H) || 0.3;
            c.camera.position.set(radius * 1.3, radius * 1.1, radius * 1.6);
            c.controls.target.set(0, H / 2, 0);
            c.key.shadow.camera.left = c.key.shadow.camera.bottom = -radius;
            c.key.shadow.camera.right = c.key.shadow.camera.top = radius;
            c.key.shadow.camera.updateProjectionMatrix();
            c.framed = true;
        }
    }, [rotation, axis, cm, cropOn, radiusCm, bottomCm, guides, model3d.realDiameterCm]);

    useEffect(() => {
        if (loading) return;
        const t = setTimeout(update, 60);
        return () => clearTimeout(t);
    }, [loading, update]);

    const view = (name) => {
        const c = ctx.current;
        if (!c.camera || !dims) return;
        const R = Math.max(dims.widthCm, dims.heightCm) / 100 || 0.3;
        const h = dims.heightCm / 200;
        const pos = { front: [0, h + R * 0.25, R * 2.4], top: [0.0001, R * 2.6, 0.0001], three: [R * 1.3, R * 1.1, R * 1.6] }[name];
        c.camera.position.set(...pos);
        c.controls.target.set(0, h, 0);
    };

    const rotate = (i, deg) => setRotation((r) => r.map((v, j) => (j === i ? ((v + deg + 540) % 360) - 180 : v)));
    // Fine levelling: offset (±25°) around the nearest quarter turn chosen with the buttons.
    const base = (v) => Math.round(v / 90) * 90;
    const setFine = (i, deg) => setRotation((r) => r.map((v, j) => (j === i ? base(v) + Number(deg) : v)));

    /** Renders a clean poster (transparent background, 3/4 view) of the processed model. */
    const renderPoster = async (glbUrl) => {
        const c = ctx.current;
        const { THREE, renderer, scene, camera, controls } = c;
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const gltf = await new GLTFLoader().loadAsync(glbUrl);
        const finalModel = gltf.scene;
        finalModel.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        const prev = { norm: c.norm.visible, crop: c.cropGroup.visible, grid: c.grid.visible, pos: camera.position.clone(), target: controls.target.clone(), aspect: camera.aspect };
        c.norm.visible = false; c.cropGroup.visible = false; c.grid.visible = false;
        scene.add(finalModel);
        const b = new THREE.Box3().setFromObject(finalModel, true);
        const size = b.getSize(new THREE.Vector3());
        const R = Math.max(size.x, size.y, size.z) || 0.3;
        const W = 1024, H = 1024;
        const old = renderer.getSize(new THREE.Vector2());
        renderer.setSize(W, H, false);
        camera.aspect = 1; camera.updateProjectionMatrix();
        camera.position.set(R * 1.15, R * 1.05 + size.y * 0.5, R * 1.45);
        camera.lookAt(0, size.y * 0.45, 0);
        renderer.render(scene, camera);
        const blob = await new Promise((res) => renderer.domElement.toBlob(res, 'image/png'));
        // restore
        scene.remove(finalModel);
        renderer.setSize(old.x, old.y);
        camera.aspect = prev.aspect; camera.updateProjectionMatrix();
        camera.position.copy(prev.pos); controls.target.copy(prev.target);
        c.norm.visible = prev.norm; c.cropGroup.visible = prev.crop; c.grid.visible = prev.grid;
        return blob;
    };

    const apply = async () => {
        if (axis !== 'keep' && !(cm >= 1 && cm <= 200)) return alert('Indiquez une dimension entre 1 et 200 cm.');
        setBusy('apply');
        try {
            const res = await fetch(`/api/dishes/${dishId}/model3d`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rotation,
                    reference: { axis, cm: axis === 'keep' ? null : Number(cm) },
                    crop: cropOn ? { radiusCm: Number(radiusCm) || round1((dims?.widthCm || 26) / 2), bottomCm: Number(bottomCm) || 0 } : null,
                    quality,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            let m = json.data;
            setBusy('poster');
            try {
                const blob = await renderPoster(m.glb);
                const poster = await uploadFile(blob, { filename: 'apercu-plat.png' });
                const r2 = await fetch(`/api/dishes/${dishId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model3d: { poster } }) });
                const j2 = await r2.json();
                if (j2.success) m = j2.data.model3d;
            } catch (e) { console.warn('poster', e); }
            onApplied(m);
        } catch (e) {
            alert(e.message);
        } finally {
            setBusy('');
        }
    };

    const reset = () => { setRotation([0, 0, 0]); setCropOn(false); setRadiusCm(0); setBottomCm(0); setAxis(model3d.source === 'scan' ? 'keep' : 'width'); };

    const section = { padding: '1rem 0', borderBottom: '1px solid #eee' };
    const h = { fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 6 };
    const small = { display: 'flex', alignItems: 'center', gap: 4, padding: '0.45rem 0.7rem', borderRadius: '0.6rem', border: '1px solid #ddd', background: 'white', fontWeight: 700, fontSize: '0.8rem' };
    const maxRadius = dims ? Math.ceil(dims.widthCm / 2 + 2) : 30;
    const maxBottom = dims ? Math.ceil(dims.heightCm * 0.6) : 10;

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#f6f2ea', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: '#1a1a1a', color: 'white' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={18} color="#FFC244" /> Studio 3D</strong>
                <button type="button" onClick={onClose} aria-label="Fermer" style={{ color: 'white' }}><X size={24} /></button>
            </div>
            <div className="studio-body" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <div style={{ position: 'relative', flex: 1, minHeight: 0, minWidth: 0 }}>
                    <div ref={mountRef} style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 30%, #ffffff 0%, #f3eee5 60%, #e6ddcf 100%)' }} />
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6b6358' }}>
                            <Loader2 className="spin-slow" /> Chargement du modèle original…
                        </div>
                    )}
                    {error && <div style={{ position: 'absolute', top: 16, left: 16, right: 16, background: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '0.8rem' }}>{error}</div>}
                    {dims && (
                        <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(255,255,255,0.92)', borderRadius: '0.8rem', padding: '0.5rem 0.8rem', fontSize: '0.8rem', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                            <div style={{ fontWeight: 800 }}>L {dims.widthCm} × P {dims.depthCm} × H {dims.heightCm} cm</div>
                            {finalDims && <div style={{ color: '#b45309', fontWeight: 700 }}>Après recadrage : L {finalDims.widthCm} × P {finalDims.depthCm} × H {finalDims.heightCm} cm</div>}
                            {guides && <div style={{ color: '#8a7f70' }}>Grille : carreaux de 5 cm</div>}
                        </div>
                    )}
                    <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 6 }}>
                        {[['three', '3/4'], ['front', 'Face'], ['top', 'Dessus']].map(([k, l]) => (
                            <button key={k} type="button" onClick={() => view(k)} style={small}><Eye size={13} /> {l}</button>
                        ))}
                        <button type="button" onClick={() => setGuides((g) => !g)} style={{ ...small, background: guides ? '#1a1a1a' : 'white', color: guides ? 'white' : '#1a1a1a' }}><Grid3x3 size={13} /></button>
                    </div>
                </div>

                <div className="studio-panel" style={{ width: 360, background: 'white', overflowY: 'auto', padding: '0 1.2rem 1.2rem', borderLeft: '1px solid #eee' }}>
                    <div style={section}>
                        <div style={h}><RotateCw size={16} /> 1. Orientation</div>
                        <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 8 }}>Le plat doit reposer à plat sur la grille, le dessus vers le haut.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 6, alignItems: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                            {[['Basculer (X)', 0], ['Pivoter (Y)', 1], ['Rouler (Z)', 2]].map(([l, i]) => (
                                <React.Fragment key={i}>
                                    <span>{l}</span>
                                    <button type="button" style={small} onClick={() => rotate(i, -90)}><RotateCcw size={13} /> 90°</button>
                                    <button type="button" style={small} onClick={() => rotate(i, 90)}><RotateCw size={13} /> 90°</button>
                                </React.Fragment>
                            ))}
                        </div>
                        {[['Inclinaison avant/arrière', 0], ['Inclinaison gauche/droite', 2]].map(([l, i]) => (
                            <label key={i} style={{ display: 'block', fontSize: '0.78rem', marginTop: 10 }}>
                                {l} : <strong>{Math.round((rotation[i] - base(rotation[i])) * 10) / 10}°</strong>
                                <input type="range" min="-25" max="25" step="0.5" value={rotation[i] - base(rotation[i])} onChange={(e) => setFine(i, e.target.value)} style={{ width: '100%' }} />
                            </label>
                        ))}
                    </div>

                    <div style={section}>
                        <div style={h}><Ruler size={16} /> 2. Taille réelle</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                            {[['width', 'Par la largeur'], ['height', 'Par la hauteur'], ['keep', 'Taille du scan']].map(([k, l]) => (
                                <button key={k} type="button" onClick={() => setAxis(k)} style={{ ...small, background: axis === k ? '#1a1a1a' : 'white', color: axis === k ? 'white' : '#1a1a1a' }}>{l}</button>
                            ))}
                        </div>
                        {axis !== 'keep' ? (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                                {axis === 'width' ? 'Largeur / diamètre du plat' : 'Hauteur du plat'}
                                <input type="number" min="1" max="200" step="0.5" value={cm} onChange={(e) => setCm(e.target.value)} style={{ width: 80, padding: '0.45rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} /> cm
                            </label>
                        ) : (
                            <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>Garde l’échelle mesurée par l’application de scan (LiDAR, Object Capture…).</p>
                        )}
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>Mesurez l’assiette avec un mètre : c’est la taille exacte que verra le client sur sa table.</p>
                    </div>

                    <div style={section}>
                        <div style={h}><Scissors size={16} /> 3. Nettoyage</div>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                            <input type="checkbox" checked={cropOn} onChange={(e) => { setCropOn(e.target.checked); if (e.target.checked && !radiusCm && dims) setRadiusCm(round1(dims.widthCm / 2)); }} />
                            Retirer la table et le décor autour du plat
                        </label>
                        {cropOn && (
                            <>
                                <label style={{ display: 'block', fontSize: '0.78rem', marginTop: 10 }}>
                                    Rayon conservé : <strong>{radiusCm} cm</strong>
                                    <input type="range" min="1" max={maxRadius} step="0.25" value={radiusCm} onChange={(e) => setRadiusCm(Number(e.target.value))} style={{ width: '100%' }} />
                                </label>
                                <label style={{ display: 'block', fontSize: '0.78rem', marginTop: 6 }}>
                                    Couper sous : <strong>{bottomCm} cm</strong> (surface de la table)
                                    <input type="range" min="0" max={maxBottom} step="0.1" value={bottomCm} onChange={(e) => setBottomCm(Number(e.target.value))} style={{ width: '100%' }} />
                                </label>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Le cylindre doré montre la zone gardée. Remontez « Couper sous » jusqu’à faire disparaître la table.</p>
                            </>
                        )}
                    </div>

                    <div style={section}>
                        <div style={h}><Sparkles size={16} /> 4. Qualité</div>
                        <div style={{ display: 'grid', gap: 6 }}>
                            {QUALITIES.map(([k, l, d]) => (
                                <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.82rem', padding: '0.5rem', borderRadius: '0.6rem', border: quality === k ? '2px solid #1a1a1a' : '1px solid #eee', cursor: 'pointer' }}>
                                    <input type="radio" name="q" checked={quality === k} onChange={() => setQuality(k)} />
                                    <span><strong>{l}</strong><br /><span style={{ color: '#6b7280' }}>{d}</span></span>
                                </label>
                            ))}
                        </div>
                        {model3d.triangles ? <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>Version actuelle : {model3d.triangles.toLocaleString('fr-FR')} triangles.</p> : null}
                    </div>

                    <div style={{ display: 'grid', gap: 8, paddingTop: '1rem' }}>
                        <button type="button" className="btn-primary" onClick={apply} disabled={!!busy || loading} style={{ justifyContent: 'center' }}>
                            {busy === 'apply' ? <><Loader2 size={18} className="spin-slow" /> Traitement du modèle…</> : busy === 'poster' ? <><Loader2 size={18} className="spin-slow" /> Création de l’aperçu…</> : <><Check size={18} /> Appliquer au plat</>}
                        </button>
                        <button type="button" onClick={reset} disabled={!!busy} style={{ ...small, justifyContent: 'center', padding: '0.7rem' }}><Undo2 size={14} /> Réinitialiser les réglages</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
