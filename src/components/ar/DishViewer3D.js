"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Smartphone, Ruler, Move3d } from 'lucide-react';

let loader;
const loadModelViewer = () => (loader ||= import('@google/model-viewer'));

const fmtCm = (v) => `${Math.round(v * 10) / 10}`.replace('.', ',');

/**
 * Premium 3D viewer + "Voir sur ma table" (augmented reality, real size).
 * - Android: WebXR / Scene Viewer, iPhone: Quick Look (USDZ generated on the fly when none is provided).
 * - The GLB is already at its real size (baked on the server), so AR shows the dish 1:1 on the table.
 * - "Dimensions" overlays width / depth / height lines in centimetres, like product pages.
 */
export default function DishViewer3D({ model3d, name, poster, height = 360, compact = false, autoRotate = true }) {
    const ref = useRef(null);
    const svgRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [arSupported, setArSupported] = useState(null);
    const [arStatus, setArStatus] = useState('');
    const [showDims, setShowDims] = useState(false);
    const [box, setBox] = useState(null); // { c: center, s: size } in metres
    const [hint, setHint] = useState(true);

    useEffect(() => {
        let alive = true;
        loadModelViewer().then(() => alive && setReady(true));
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!ready || !el) return;
        const onLoad = () => {
            setLoaded(true);
            setArSupported(Boolean(el.canActivateAR));
            const c = el.getBoundingBoxCenter();
            const s = el.getDimensions();
            setBox({ c: { x: c.x, y: c.y, z: c.z }, s: { x: s.x, y: s.y, z: s.z } });
            setTimeout(() => setHint(false), 4000);
        };
        const onProgress = (e) => setProgress(e.detail?.totalProgress ?? 0);
        const onAr = (e) => setArStatus(e.detail?.status === 'failed' ? "La réalité augmentée n'a pas pu démarrer sur cet appareil." : '');
        el.addEventListener('load', onLoad);
        el.addEventListener('progress', onProgress);
        el.addEventListener('ar-status', onAr);
        return () => {
            el.removeEventListener('load', onLoad);
            el.removeEventListener('progress', onProgress);
            el.removeEventListener('ar-status', onAr);
        };
    }, [ready, model3d.glb]);

    // Dimension lines follow the camera.
    const drawLines = useCallback(() => {
        const el = ref.current, svg = svgRef.current;
        if (!el || !svg || !showDims) return;
        const pos = (n) => el.queryHotspot(`hotspot-${n}`)?.canvasPosition;
        const pairs = [['dim-w0', 'dim-w1'], ['dim-d0', 'dim-d1'], ['dim-h0', 'dim-h1']];
        svg.querySelectorAll('line').forEach((line, i) => {
            const a = pos(pairs[i][0]), b = pos(pairs[i][1]);
            if (!a || !b) return;
            line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
            line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
        });
    }, [showDims]);

    useEffect(() => {
        const el = ref.current;
        if (!el || !showDims) return;
        let raf = 0;
        const onCam = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawLines); };
        el.addEventListener('camera-change', onCam);
        el.autoRotate = false;
        // dish facing the customer, camera stepped back so the dimension lines fit in the frame
        el.resetTurntableRotation?.(0);
        el.cameraOrbit = '25deg 62deg 150%';
        // hotspots are registered asynchronously: redraw for a moment after they appear
        const until = performance.now() + 1500;
        const warm = () => { drawLines(); if (performance.now() < until) raf = requestAnimationFrame(warm); };
        raf = requestAnimationFrame(warm);
        return () => {
            el.removeEventListener('camera-change', onCam);
            cancelAnimationFrame(raf);
            el.autoRotate = autoRotate;
            el.cameraOrbit = '30deg 64deg 108%';
        };
    }, [showDims, drawLines, box, autoRotate]);

    if (!model3d?.glb) return null;

    const dims = model3d.dimensions?.widthCm ? model3d.dimensions
        : box ? { widthCm: Math.max(box.s.x, box.s.z) * 100, depthCm: Math.min(box.s.x, box.s.z) * 100, heightCm: box.s.y * 100 } : null;

    // Hotspot positions on the bounding box (front-bottom edge, right-bottom edge, front-right vertical edge)
    const hs = [];
    if (box) {
        const { c, s } = box;
        const x0 = c.x - s.x / 2, x1 = c.x + s.x / 2, y0 = c.y - s.y / 2, y1 = c.y + s.y / 2, z0 = c.z - s.z / 2, z1 = c.z + s.z / 2;
        const o = Math.max(s.x, s.z) * 0.06; // keep lines slightly away from the dish
        const p = (x, y, z) => `${x}m ${y}m ${z}m`;
        hs.push(
            ['dim-w0', p(x0, y0, z1 + o)], ['dim-w1', p(x1, y0, z1 + o)],
            ['dim-d0', p(x1 + o, y0, z1)], ['dim-d1', p(x1 + o, y0, z0)],
            ['dim-h0', p(x1 + o, y0, z1 + o)], ['dim-h1', p(x1 + o, y1, z1 + o)],
            ['dim-w', p(c.x, y0, z1 + o), fmtCm(s.x * 100)],
            ['dim-d', p(x1 + o, y0, c.z), fmtCm(s.z * 100)],
            ['dim-h', p(x1 + o, c.y, z1 + o), fmtCm(s.y * 100)],
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{
                position: 'relative', width: '100%', height, borderRadius: compact ? '1rem' : '1.5rem', overflow: 'hidden',
                background: 'radial-gradient(120% 90% at 50% 30%, #ffffff 0%, #f6f2ea 55%, #e9e2d6 100%)',
            }}>
                {/* drawn under the transparent 3D canvas: the dish and the labels stay on top */}
                {showDims && (
                    <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {[0, 1, 2].map((i) => <line key={i} stroke="#1a1a1a" strokeWidth="1.5" strokeDasharray="5 4" />)}
                    </svg>
                )}

                {ready && (
                    <model-viewer
                        ref={ref}
                        src={model3d.glb}
                        ios-src={model3d.usdz || undefined}
                        poster={model3d.poster || poster || undefined}
                        alt={`Modèle 3D : ${name}`}
                        camera-controls=""
                        touch-action="pan-y"
                        auto-rotate={autoRotate ? '' : undefined}
                        auto-rotate-delay="2500"
                        rotation-per-second="14deg"
                        camera-orbit="30deg 64deg 108%"
                        min-camera-orbit="auto 10deg auto"
                        max-camera-orbit="auto 86deg 300%"
                        interpolation-decay="120"
                        shadow-intensity="1.1"
                        shadow-softness="0.75"
                        exposure="1.05"
                        environment-image="neutral"
                        interaction-prompt="auto"
                        ar=""
                        ar-modes="webxr scene-viewer quick-look"
                        ar-placement="floor"
                        ar-scale="fixed"
                        xr-environment=""
                        style={{ width: '100%', height: '100%', '--poster-color': 'transparent', '--progress-bar-height': '0px' }}
                    >
                        <button
                            slot="ar-button"
                            style={{
                                position: 'absolute', left: '50%', bottom: '1rem', transform: 'translateX(-50%)',
                                display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.85rem 1.4rem',
                                borderRadius: '2rem', background: 'linear-gradient(135deg,#1a1a1a,#3b3022)', color: 'white', fontWeight: 800,
                                fontSize: '0.95rem', boxShadow: '0 12px 30px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', letterSpacing: '0.01em',
                            }}
                        >
                            <Smartphone size={18} /> Voir sur ma table
                        </button>
                        {showDims && hs.map(([slot, position, label]) => (
                            <div key={slot} slot={`hotspot-${slot}`} data-position={position} data-normal="0 1 0"
                                style={label ? {
                                    background: 'white', color: '#1a1a1a', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem',
                                    borderRadius: '0.6rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', pointerEvents: 'none',
                                } : { width: 0, height: 0, pointerEvents: 'none' }}>
                                {label ? `${label} cm` : null}
                            </div>
                        ))}
                        <div slot="progress-bar" />
                    </model-viewer>
                )}

                {!loaded && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', color: '#6b6358', pointerEvents: 'none' }}>
                        <Box size={28} className="spin-slow" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Préparation du plat en 3D…</span>
                        <div style={{ width: 140, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2 }}>
                            <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: '#c8a45c', borderRadius: 2, transition: 'width 0.2s' }} />
                        </div>
                    </div>
                )}

                {loaded && !compact && hint && !showDims && (
                    <div style={{ position: 'absolute', top: '4.6rem', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', pointerEvents: 'none', display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', padding: '0.35rem 0.75rem', borderRadius: '1rem', fontSize: '0.72rem', fontWeight: 700, color: '#4b4337' }}>
                        <Move3d size={13} /> Glissez pour tourner · pincez pour zoomer
                    </div>
                )}

                {loaded && dims && (
                    <button type="button" onClick={() => setShowDims((v) => !v)} aria-pressed={showDims} style={{
                        position: 'absolute', right: '0.8rem', bottom: compact || arSupported === false ? '0.8rem' : '4.8rem', display: 'flex', alignItems: 'center', gap: 5,
                        background: showDims ? '#1a1a1a' : 'rgba(255,255,255,0.92)', color: showDims ? 'white' : '#1a1a1a',
                        padding: '0.45rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                    }}>
                        <Ruler size={14} /> Dimensions
                    </button>
                )}

                {loaded && arSupported === false && !compact && (
                    <div style={{ position: 'absolute', bottom: '0.8rem', left: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.92)', padding: '0.4rem 0.7rem', borderRadius: '1rem', fontSize: '0.72rem', fontWeight: 600, color: '#6b6358' }}>
                        <Smartphone size={13} /> AR sur téléphone
                    </div>
                )}

                {arStatus && (
                    <div style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', left: '0.8rem', background: '#fee2e2', color: '#991b1b', padding: '0.5rem 0.8rem', borderRadius: '0.8rem', fontSize: '0.8rem' }}>{arStatus}</div>
                )}
            </div>

            {!compact && dims && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', padding: '0.7rem 0 0', fontSize: '0.8rem', color: '#6b6358', flexWrap: 'wrap' }}>
                    <span>Taille réelle</span>
                    <strong style={{ color: '#1a1a1a' }}>L {fmtCm(dims.widthCm)} × P {fmtCm(dims.depthCm)} × H {fmtCm(dims.heightCm)} cm</strong>
                </div>
            )}
        </div>
    );
}
