"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Check, RotateCcw, Upload, Timer, Trash2, Sun, Layers, Hand, AlertTriangle } from 'lucide-react';
import { compressImage, uploadFile } from '@/lib/upload-client';

const SEGMENTS = 24;            // one photo every 15° around the dish
const PASSES = [
    { key: 'high', label: 'Vue plongeante', hint: 'Téléphone au-dessus du plat, incliné à ~60°' },
    { key: 'mid', label: 'Vue de trois-quarts', hint: 'À hauteur d’épaule, incliné à ~35°' },
    { key: 'low', label: 'Vue rasante', hint: 'Presque à hauteur de la table' },
];
const TARGET = 48;              // recommended number of photos (photogrammetry: 40-60)
const SHARPNESS_MIN = 18;       // variance of the Laplacian below which a photo is considered blurry
const BRIGHTNESS = [45, 225];   // mean luminance accepted

/** Sharpness (variance of the Laplacian) and brightness, computed on a small grayscale copy. */
function measure(source) {
    const w = 320, h = Math.round((source.height / source.width) * 320) || 240;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(source, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    let sum = 0;
    for (let i = 0; i < w * h; i++) { const v = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; gray[i] = v; sum += v; }
    let n = 0, mean = 0, m2 = 0;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const lap = gray[i - 1] + gray[i + 1] + gray[i - w] + gray[i + w] - 4 * gray[i];
            n++; const delta = lap - mean; mean += delta / n; m2 += delta * (lap - mean);
        }
    }
    return { sharpness: m2 / Math.max(1, n - 1), brightness: sum / (w * h) };
}

function verdict({ sharpness, brightness }) {
    if (brightness < BRIGHTNESS[0]) return 'trop sombre';
    if (brightness > BRIGHTNESS[1]) return 'surexposée';
    if (sharpness < SHARPNESS_MIN) return 'floue';
    return null;
}

const TIPS = [
    [Sun, 'Lumière douce et uniforme', 'Pas de flash ni de spot direct. Évitez les ombres dures et les reflets.'],
    [Layers, 'Table dégagée', 'Fond uni et mat, rien autour du plat. Le plat entier doit rester dans le cercle.'],
    [Hand, 'C’est vous qui tournez', 'Ne bougez plus le plat. Faites 3 tours à pas réguliers : dessus, épaule, ras de table.'],
];

/**
 * Guided capture: the manager walks around the dish and takes photos from 3 heights.
 * The compass (when available) fills the ring segment matching the current angle,
 * so it is easy to see which sides of the dish are still missing.
 */
export default function DishScanStudio({ onClose, onDone, initialPhotos = [], minPhotos = 8 }) {
    const MIN = minPhotos;
    const [intro, setIntro] = useState(true);
    const [warning, setWarning] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState('');
    const [pass, setPass] = useState(0);
    const [shots, setShots] = useState([]); // { blob, preview, pass, segment, issue }
    const [heading, setHeading] = useState(null);
    const [autoMode, setAutoMode] = useState(false);
    const [flash, setFlash] = useState(false);
    const [uploading, setUploading] = useState(null); // progress 0..1
    const [hasCompass, setHasCompass] = useState(false);

    // Camera
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setError('Caméra indisponible dans ce navigateur (le site doit être en HTTPS). Utilisez « Importer des photos ».');
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } },
                    audio: false,
                });
                if (cancelled) return stream.getTracks().forEach((t) => t.stop());
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(() => {});
                }
            } catch {
                setError("Accès à la caméra refusé. Autorisez la caméra ou importez des photos.");
            }
        })();
        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    // Compass (Android directly; iOS asks permission on first tap)
    useEffect(() => {
        const onOrient = (e) => {
            const h = typeof e.webkitCompassHeading === 'number' ? e.webkitCompassHeading : (e.alpha != null ? 360 - e.alpha : null);
            if (h != null) { setHeading(h); setHasCompass(true); }
        };
        window.addEventListener('deviceorientation', onOrient);
        return () => window.removeEventListener('deviceorientation', onOrient);
    }, []);

    const askCompass = useCallback(async () => {
        try {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                await DeviceOrientationEvent.requestPermission();
            }
        } catch { /* refused: ring falls back to sequential filling */ }
    }, []);

    const segmentNow = useCallback((count) => (
        heading != null ? Math.floor((((heading % 360) + 360) % 360) / (360 / SEGMENTS)) : count % SEGMENTS
    ), [heading]);

    const capture = useCallback(async () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;
        if (shots.length === 0) askCompass();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const issue = verdict(measure(canvas));
        if (issue) {
            setWarning(`Photo ${issue} — ${issue === 'floue' ? 'tenez le téléphone immobile' : 'ajustez la lumière'}.`);
            navigator.vibrate?.([40, 40, 40]);
            if (autoMode) return; // rafale : on ignore la photo ratée
        } else setWarning('');
        const bitmap = await createImageBitmap(canvas);
        const blob = await compressImage(bitmap, { maxSize: 2048, quality: 0.9 });
        setFlash(true);
        setTimeout(() => setFlash(false), 120);
        navigator.vibrate?.(30);
        setShots((prev) => [...prev, { blob, preview: URL.createObjectURL(blob), pass, issue, segment: segmentNow(prev.filter((s) => s.pass === pass).length) }]);
    }, [pass, segmentNow, shots.length, askCompass, autoMode]);

    // Auto mode: one photo every 1.2 s while the manager walks around the dish.
    useEffect(() => {
        if (!autoMode) return;
        const t = setInterval(capture, 1200);
        return () => clearInterval(t);
    }, [autoMode, capture]);

    const importFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        const added = [];
        for (const f of files) {
            const bmp = await createImageBitmap(f);
            const issue = verdict(measure(bmp));
            const blob = await compressImage(bmp, { maxSize: 2048, quality: 0.9 });
            added.push({ blob, preview: URL.createObjectURL(blob), pass, issue, segment: (shots.length + added.length) % SEGMENTS });
        }
        setShots((prev) => [...prev, ...added]);
    };

    const removeShot = (i) => setShots((prev) => prev.filter((_, j) => j !== i));

    const finish = async () => {
        setAutoMode(false);
        setUploading(0);
        try {
            const urls = [];
            for (let i = 0; i < shots.length; i++) {
                urls.push(await uploadFile(shots[i].blob, { filename: `scan-${i + 1}.jpg` }));
                setUploading((i + 1) / shots.length);
            }
            onDone([...initialPhotos, ...urls]);
        } catch (err) {
            alert("Erreur pendant l'envoi des photos : " + err.message);
            setUploading(null);
        }
    };

    const covered = new Set(shots.filter((s) => s.pass === pass && !s.issue).map((s) => s.segment));
    const badCount = shots.filter((s) => s.issue).length;
    const total = shots.length + initialPhotos.length;
    const currentSegment = heading != null ? segmentNow(0) : null;

    // Rendered in <body>: the studio is opened from inside the dish <form>.
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.6)', zIndex: 2 }}>
                <button type="button" onClick={onClose} aria-label="Fermer" style={{ color: 'white' }}><X size={26} /></button>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800 }}>Scanner le plat · {PASSES[pass].label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{PASSES[pass].hint}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: total >= TARGET ? '#4ade80' : 'var(--glovo-yellow)' }}>{total}/{TARGET}</div>
            </div>

            {/* Viewfinder */}
            <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {flash && <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.6 }} />}

                {/* Plate guide + coverage ring */}
                <svg viewBox="0 0 200 200" style={{ position: 'absolute', left: '50%', top: '50%', width: 'min(78vw, 56vh)', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                    <ellipse cx="100" cy="100" rx="62" ry={pass === 0 ? 52 : pass === 1 ? 36 : 18} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeDasharray="4 4" />
                    {Array.from({ length: SEGMENTS }, (_, i) => {
                        const a0 = (i / SEGMENTS) * Math.PI * 2 - Math.PI / 2;
                        const a1 = ((i + 0.82) / SEGMENTS) * Math.PI * 2 - Math.PI / 2;
                        const r = 92;
                        const d = `M ${100 + r * Math.cos(a0)} ${100 + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${100 + r * Math.cos(a1)} ${100 + r * Math.sin(a1)}`;
                        const isCurrent = currentSegment === i;
                        return <path key={i} d={d} fill="none" strokeLinecap="round" strokeWidth={isCurrent ? 7 : 5}
                            stroke={covered.has(i) ? '#4ade80' : isCurrent ? 'var(--glovo-yellow)' : 'rgba(255,255,255,0.28)'} />;
                    })}
                </svg>

                <div style={{ position: 'absolute', bottom: '0.8rem', left: '1rem', right: '1rem', textAlign: 'center', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', borderRadius: '0.8rem', padding: '0.5rem' }}>
                    {warning ? <span style={{ color: '#fbbf24', fontWeight: 700 }}>{warning}</span> : error || (hasCompass
                        ? 'Tournez autour du plat : chaque segment devient vert quand l’angle est photographié.'
                        : 'Gardez le plat dans le cercle et faites le tour complet, une photo tous les petits pas.')}
                </div>
            </div>

            {/* Thumbnails */}
            {shots.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', padding: '0.5rem 1rem', background: '#111' }}>
                    {shots.map((s, i) => (
                        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                            <img src={s.preview} alt="" title={s.issue ? `Photo ${s.issue}` : ''} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, opacity: s.pass === pass ? 1 : 0.5, outline: s.issue ? '3px solid #ef4444' : 'none' }} />
                            <button type="button" onClick={() => removeShot(i)} aria-label="Supprimer" style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={10} /></button>
                        </div>
                    ))}
                </div>
            )}

            {badCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 1rem', background: '#111', fontSize: '0.8rem', color: '#fca5a5' }}>
                    <AlertTriangle size={15} /> {badCount} photo(s) à refaire (cadre rouge)
                    <button type="button" onClick={() => setShots((prev) => prev.filter((s) => !s.issue))} style={{ marginLeft: 'auto', color: 'white', textDecoration: 'underline' }}>Retirer</button>
                </div>
            )}

            {intro && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(10,10,10,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem' }}>
                    <div style={{ maxWidth: 440, width: '100%' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>Un scan digne d’une vitrine</h2>
                        <p style={{ opacity: 0.75, marginBottom: '1.2rem', fontSize: '0.9rem' }}>30 secondes de préparation font toute la différence sur la table du client.</p>
                        {TIPS.map(([Icon, t, d]) => (
                            <div key={t} style={{ display: 'flex', gap: 12, marginBottom: '0.9rem' }}>
                                <span style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,194,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={20} color="#FFC244" /></span>
                                <div><strong>{t}</strong><div style={{ fontSize: '0.85rem', opacity: 0.75 }}>{d}</div></div>
                            </div>
                        ))}
                        <p style={{ fontSize: '0.82rem', opacity: 0.75, margin: '0.4rem 0 1.2rem' }}>Objectif : {TARGET} photos nettes (minimum {MIN}). Les photos floues ou mal éclairées sont signalées automatiquement.</p>
                        <button type="button" onClick={() => setIntro(false)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Commencer le scan</button>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{ padding: '1rem 1rem calc(1rem + env(safe-area-inset-bottom))', background: '#111', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem', gap: 2, cursor: 'pointer' }}>
                        <Upload size={22} /> Importer
                        <input type="file" accept="image/*" multiple hidden onChange={importFiles} />
                    </label>
                    <button type="button" onClick={() => setAutoMode((v) => !v)} disabled={!!error} style={{ color: autoMode ? 'var(--glovo-yellow)' : 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem', gap: 2 }}>
                        <Timer size={22} /> {autoMode ? 'Auto ON' : 'Auto'}
                    </button>
                </div>

                <button type="button" onClick={capture} disabled={!!error} aria-label="Prendre la photo" style={{ width: 74, height: 74, borderRadius: '50%', border: '5px solid white', background: autoMode ? 'var(--glovo-yellow)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Camera size={28} />
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {pass < PASSES.length - 1 && (
                        <button type="button" onClick={() => { setPass(pass + 1); setAutoMode(false); }} style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.65rem', gap: 2 }}>
                            <RotateCcw size={22} /> Hauteur suiv.
                        </button>
                    )}
                    <button type="button" onClick={finish} disabled={total < MIN || uploading !== null} style={{ background: total >= MIN ? '#22c55e' : '#444', color: 'white', borderRadius: '1rem', padding: '0.6rem 0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={18} /> {uploading !== null ? `${Math.round(uploading * 100)}%` : 'Terminer'}
                    </button>
                </div>
            </div>
        </div>
    , document.body);
}
