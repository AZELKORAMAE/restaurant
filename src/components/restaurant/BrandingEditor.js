"use client";
import React, { useRef, useState } from 'react';
import { Upload, ImageIcon, Check, Crosshair, Trash2, Loader2, Palette, Sun } from 'lucide-react';
import { COVER_PRESETS, ACCENTS, normalizeTheme } from '@/lib/theme';

const label = { fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.7rem', display: 'flex', alignItems: 'center', gap: 8 };
const hint = { fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: 6 };

/**
 * Logo, cover image (own photo or gallery), focal point, overlay and accent colour.
 * value: { logo, coverImage, theme } — onChange(patch)
 * onFile(kind: 'logo' | 'cover', file) → Promise<url>: the parent decides (upload now, or keep for the form).
 */
export default function BrandingEditor({ value, onChange, onFile }) {
    const t = normalizeTheme(value.theme);
    const [busy, setBusy] = useState('');
    const [tab, setTab] = useState(value.coverImage && !COVER_PRESETS.some((p) => p.url === value.coverImage) ? 'mine' : 'gallery');
    const focalRef = useRef(null);
    const setTheme = (patch) => onChange({ theme: { ...t, ...patch } });

    const pick = async (kind, e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert('Choisissez une image (JPEG, PNG ou WebP).');
        setBusy(kind);
        try {
            const url = await onFile(kind, file);
            onChange(kind === 'logo' ? { logo: url } : { coverImage: url, coverPreset: null });
            if (kind === 'cover') setTheme({ focalX: 50, focalY: 50 });
        } catch (err) { alert(err.message); } finally { setBusy(''); }
    };

    const setFocal = (e) => {
        const r = focalRef.current.getBoundingClientRect();
        const x = Math.round(((e.clientX - r.left) / r.width) * 100);
        const y = Math.round(((e.clientY - r.top) / r.height) * 100);
        setTheme({ focalX: Math.min(100, Math.max(0, x)), focalY: Math.min(100, Math.max(0, y)) });
    };

    return (
        <div style={{ display: 'grid', gap: '1.8rem' }}>
            {/* Logo */}
            <div>
                <div style={label}><ImageIcon size={18} /> Logo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{
                        width: 96, height: 96, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative',
                        background: value.logo ? 'white' : 'repeating-linear-gradient(45deg,#f4f0e8,#f4f0e8 8px,#efe8dc 8px,#efe8dc 16px)',
                        border: value.logo ? '3px solid white' : '2px dashed #d6ccbb', boxShadow: value.logo ? 'var(--shadow-float)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {busy === 'logo' ? <Loader2 className="spin-slow" /> : value.logo
                            ? <img src={value.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Upload size={22} color="#8a7f70" />}
                        <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => pick('logo', e)} />
                    </label>
                    <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{value.logo ? 'Touchez le logo pour le changer' : 'Ajoutez votre logo'}</div>
                        <div style={hint}>Carré, idéalement 512 × 512 px. Il s’affiche en grand en haut de votre site et dans l’en-tête.</div>
                        {value.logo && <button type="button" onClick={() => onChange({ logo: null })} style={{ marginTop: 6, color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700, display: 'flex', gap: 4, alignItems: 'center' }}><Trash2 size={13} /> Retirer</button>}
                    </div>
                </div>
            </div>

            {/* Cover */}
            <div>
                <div style={label}><ImageIcon size={18} /> Image de fond</div>
                <div style={{ display: 'inline-flex', background: '#f1ece3', borderRadius: 999, padding: 4, marginBottom: '0.9rem' }}>
                    {[['gallery', 'Galerie'], ['mine', 'Ma photo']].map(([k, l]) => (
                        <button key={k} type="button" onClick={() => setTab(k)} style={{
                            padding: '0.45rem 1.1rem', borderRadius: 999, fontWeight: 700, fontSize: '0.85rem',
                            background: tab === k ? 'white' : 'transparent', boxShadow: tab === k ? 'var(--shadow-soft)' : 'none',
                        }}>{l}</button>
                    ))}
                </div>

                {tab === 'gallery' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                        {COVER_PRESETS.map((p) => {
                            const active = value.coverImage === p.url;
                            return (
                                <button key={p.id} type="button" onClick={() => { onChange({ coverImage: p.url, coverPreset: p.url }); setTheme({ focalX: 50, focalY: 50 }); }}
                                    className="hover-zoom" style={{ position: 'relative', height: 84, borderRadius: 14, overflow: 'hidden', outline: active ? '3px solid var(--brand)' : 'none', outlineOffset: 2 }}>
                                    <img src={p.url.replace('w=1920', 'w=400')} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <span style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '0.3rem 0.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,.7))', color: 'white', fontSize: '0.72rem', fontWeight: 700, textAlign: 'left' }}>{p.label}</span>
                                    {active && <span style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'var(--brand)', color: 'var(--brand-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} /></span>}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <label className="btn-ghost" style={{ cursor: 'pointer' }}>
                        {busy === 'cover' ? <Loader2 size={18} className="spin-slow" /> : <Upload size={18} />} {value.coverImage && !value.coverPreset ? 'Changer la photo' : 'Choisir une photo'}
                        <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => pick('cover', e)} />
                    </label>
                )}

                {value.coverImage && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ ...label, fontSize: '0.85rem', marginBottom: '0.5rem' }}><Crosshair size={16} /> Partie de l’image à garder visible</div>
                        <div ref={focalRef} onClick={setFocal} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'crosshair', userSelect: 'none' }}>
                            <img src={value.coverImage} alt="" draggable={false} style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'contain', background: '#111' }} />
                            <span style={{
                                position: 'absolute', left: `${t.focalX}%`, top: `${t.focalY}%`, width: 30, height: 30, marginLeft: -15, marginTop: -15,
                                borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 0 2px rgba(0,0,0,.35), 0 0 0 9999px rgba(0,0,0,.12)', transition: 'left .25s, top .25s',
                            }} />
                        </div>
                        <div style={hint}>Touchez le sujet important (le plat, la salle…) : il restera visible sur téléphone comme sur ordinateur.</div>

                        <div style={{ ...label, fontSize: '0.85rem', margin: '1rem 0 0.3rem' }}><Sun size={16} /> Assombrir l’image : {Math.round(t.overlay * 100)} %</div>
                        <input type="range" min="0" max="0.85" step="0.05" value={t.overlay} onChange={(e) => setTheme({ overlay: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--brand)' }} />
                        <div style={hint}>Plus l’image est sombre, plus le nom et le logo ressortent.</div>
                    </div>
                )}
            </div>

            {/* Accent */}
            <div>
                <div style={label}><Palette size={18} /> Couleur de votre marque</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {ACCENTS.map((a) => (
                        <button key={a.color} type="button" title={a.name} aria-label={a.name} onClick={() => setTheme({ accent: a.color })} style={{
                            width: 38, height: 38, borderRadius: '50%', background: a.color, border: '3px solid white',
                            boxShadow: t.accent.toLowerCase() === a.color.toLowerCase() ? `0 0 0 2px ${a.color}` : '0 0 0 1px var(--line)',
                            transform: t.accent.toLowerCase() === a.color.toLowerCase() ? 'scale(1.1)' : 'none', transition: 'transform .2s',
                        }} />
                    ))}
                    <label title="Couleur personnalisée" style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: '1px dashed #c9bfae', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                        <Palette size={16} />
                        <input type="color" value={t.accent} onChange={(e) => setTheme({ accent: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </label>
                </div>
                <div style={hint}>Utilisée pour les boutons, la table et les badges de votre menu.</div>
            </div>
        </div>
    );
}
