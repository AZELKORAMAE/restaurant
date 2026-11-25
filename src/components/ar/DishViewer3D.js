"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Box, Smartphone, RotateCcw } from 'lucide-react';

let loader;
const loadModelViewer = () => (loader ||= import('@google/model-viewer'));

/**
 * 3D viewer + "Voir sur ma table" (augmented reality).
 * - Android: Scene Viewer / WebXR, iPhone: Quick Look (USDZ generated on the fly when none is provided).
 */
export default function DishViewer3D({ model3d, name, poster, height = 340, compact = false, autoRotate = true }) {
    const ref = useRef(null);
    const [ready, setReady] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [arSupported, setArSupported] = useState(null);
    const [arStatus, setArStatus] = useState('');

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
            // Real-world size is baked into the GLB on the server (see lib/glb.js), so the
            // model has the same size in the page, in Scene Viewer (Android) and in Quick Look (iPhone).
        };
        const onAr = (e) => {
            const s = e.detail?.status;
            setArStatus(s === 'failed' ? "La réalité augmentée n'a pas pu démarrer sur cet appareil." : '');
        };
        el.addEventListener('load', onLoad);
        el.addEventListener('ar-status', onAr);
        return () => {
            el.removeEventListener('load', onLoad);
            el.removeEventListener('ar-status', onAr);
        };
    }, [ready, model3d.glb]);

    if (!model3d?.glb) return null;

    return (
        <div style={{ position: 'relative', width: '100%', height, borderRadius: compact ? '1rem' : '1.5rem', overflow: 'hidden', background: 'radial-gradient(circle at 50% 35%, #fff 0%, #f1ece4 70%)' }}>
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
                    auto-rotate-delay="1500"
                    rotation-per-second="18deg"
                    camera-orbit="0deg 60deg auto"
                    shadow-intensity="1.2"
                    shadow-softness="0.8"
                    exposure="1.05"
                    environment-image="neutral"
                    interaction-prompt="auto"
                    ar=""
                    ar-modes="webxr scene-viewer quick-look"
                    ar-placement="floor"
                    ar-scale="fixed"
                    xr-environment=""
                    style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
                >
                    {/* Default AR button is replaced by ours */}
                    <button
                        slot="ar-button"
                        style={{
                            position: 'absolute', left: '50%', bottom: '1rem', transform: 'translateX(-50%)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.3rem',
                            borderRadius: '2rem', background: 'var(--glovo-dark)', color: 'white', fontWeight: 800,
                            fontSize: '0.95rem', boxShadow: '0 10px 25px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
                        }}
                    >
                        <Smartphone size={18} /> Voir sur ma table
                    </button>
                    <div slot="progress-bar" />
                </model-viewer>
            )}

            {!loaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: 'var(--glovo-gray)', pointerEvents: 'none' }}>
                    <Box size={28} className="spin-slow" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Chargement du plat en 3D…</span>
                </div>
            )}

            {loaded && !compact && (
                <div style={{ position: 'absolute', top: '4.6rem', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', pointerEvents: 'none', display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'rgba(255,255,255,0.9)', padding: '0.35rem 0.7rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    <RotateCcw size={13} /> Glissez pour tourner · pincez pour zoomer
                </div>
            )}

            {loaded && arSupported === false && !compact && (
                <div style={{ position: 'absolute', bottom: '0.8rem', left: '0.8rem', right: '0.8rem', textAlign: 'center', background: 'rgba(255,255,255,0.92)', padding: '0.5rem 0.8rem', borderRadius: '0.8rem', fontSize: '0.78rem', color: 'var(--glovo-gray)' }}>
                    Ouvrez ce menu sur votre téléphone pour poser le plat sur votre table en réalité augmentée.
                </div>
            )}

            {arStatus && (
                <div style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', left: '0.8rem', background: '#fee2e2', color: '#991b1b', padding: '0.5rem 0.8rem', borderRadius: '0.8rem', fontSize: '0.8rem' }}>{arStatus}</div>
            )}
        </div>
    );
}
