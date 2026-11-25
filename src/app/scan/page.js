"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, QrCode } from 'lucide-react';

/** Turns a scanned value into a path on this site (only our own menu links are followed). */
function toMenuPath(raw) {
    try {
        const url = new URL(raw, window.location.origin);
        if (url.origin === window.location.origin && url.pathname.startsWith('/r/')) return url.pathname + url.search;
    } catch { /* not a URL */ }
    return null;
}

/**
 * In-app QR scanner. Phones' camera apps already open the table QR code directly;
 * this page is for customers who start from the website.
 */
export default function ScanPage() {
    const videoRef = useRef(null);
    const [error, setError] = useState('');
    const [found, setFound] = useState('');

    useEffect(() => {
        let stream;
        let raf;
        let stopped = false;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        (async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setError('Caméra indisponible. Utilisez l’appareil photo de votre téléphone pour scanner le QR code de la table.');
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
            } catch {
                setError('Autorisez l’accès à la caméra pour scanner le QR code de votre table.');
                return;
            }
            const video = videoRef.current;
            video.srcObject = stream;
            await video.play().catch(() => {});

            const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
            const { default: jsQR } = detector ? { default: null } : await import('jsqr');

            const handle = (value) => {
                if (!value || stopped) return false;
                const path = toMenuPath(value);
                if (!path) { setFound('Ce QR code ne correspond pas à un menu de la plateforme.'); return false; }
                stopped = true;
                navigator.vibrate?.(60);
                window.location.href = path;
                return true;
            };

            const tick = async () => {
                if (stopped) return;
                if (video.readyState >= 2) {
                    try {
                        if (detector) {
                            const codes = await detector.detect(video);
                            if (codes[0] && handle(codes[0].rawValue)) return;
                        } else {
                            const w = Math.min(640, video.videoWidth);
                            const h = Math.round((video.videoHeight / video.videoWidth) * w);
                            canvas.width = w; canvas.height = h;
                            ctx.drawImage(video, 0, 0, w, h);
                            const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
                            if (code && handle(code.data)) return;
                        }
                    } catch { /* keep scanning */ }
                }
                raf = requestAnimationFrame(tick);
            };
            tick();
        })();

        return () => {
            stopped = true;
            cancelAnimationFrame(raf);
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    return (
        <main style={{ position: 'fixed', inset: 0, background: '#000', color: 'white' }}>
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem', background: 'linear-gradient(rgba(0,0,0,0.55), transparent 25%, transparent 70%, rgba(0,0,0,0.7))' }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Link href="/" aria-label="Retour" style={{ color: 'white' }}><ArrowLeft size={26} /></Link>
                    <strong style={{ fontSize: '1.1rem' }}>Scanner le QR code de la table</strong>
                </div>
                <div style={{ position: 'relative', width: 'min(70vw, 300px)', aspectRatio: '1', borderRadius: '1.5rem', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}>
                    {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => (
                        <span key={`${x}${y}`} style={{
                            position: 'absolute', width: 42, height: 42, [x ? 'right' : 'left']: -3, [y ? 'bottom' : 'top']: -3,
                            borderColor: 'var(--glovo-yellow)', borderStyle: 'solid', borderWidth: 0,
                            [`border${y ? 'Bottom' : 'Top'}Width`]: 5, [`border${x ? 'Right' : 'Left'}Width`]: 5,
                            [`border${y ? 'Bottom' : 'Top'}${x ? 'Right' : 'Left'}Radius`]: '1.5rem',
                        }} />
                    ))}
                </div>
                <div style={{ textAlign: 'center', maxWidth: 420 }}>
                    <QrCode size={28} style={{ marginBottom: 6 }} />
                    <p style={{ fontWeight: 600 }}>{error || found || 'Placez le QR code posé sur votre table dans le cadre.'}</p>
                </div>
            </div>
        </main>
    );
}
