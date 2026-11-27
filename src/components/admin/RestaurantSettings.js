"use client";
import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ExternalLink, Copy, Box, Store, Palette, MapPin, Phone, Check } from 'lucide-react';
import { uploadFile, compressImage } from '@/lib/upload-client';
import BrandingEditor from '@/components/restaurant/BrandingEditor';
import LocationPicker from '@/components/restaurant/LocationPicker';
import PhonePreview from '@/components/restaurant/PhonePreview';
import { normalizeTheme, COVER_PRESETS } from '@/lib/theme';

const SECTIONS = [['infos', 'Informations', Store], ['look', 'Apparence', Palette], ['place', 'Localisation', MapPin], ['share', 'Partager', Phone]];

export default function RestaurantSettings({ restaurant, dishes = [], onSaved }) {
    const [form, setForm] = useState(() => ({
        ...restaurant,
        theme: normalizeTheme(restaurant.theme),
        coverPreset: COVER_PRESETS.some((p) => p.url === restaurant.coverImage) ? restaurant.coverImage : null,
    }));
    const [section, setSection] = useState('look');
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saved, setSaved] = useState(false);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const menuUrl = `${origin}/r/${restaurant.slug}`;
    const with3d = dishes.filter((d) => d.model3d?.status === 'ready').length;

    const patch = (p) => { setForm((f) => ({ ...f, ...p })); setDirty(true); setSaved(false); };
    const set = (k) => (e) => patch({ [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const onFile = async (kind, file) => {
        const blob = await compressImage(file, { maxSize: kind === 'logo' ? 600 : 2000, quality: 0.88 });
        return uploadFile(blob, { filename: `${kind}.jpg` });
    };

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/restaurant', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name, description: form.description, cuisine: form.cuisine, address: form.location?.address || form.address,
                    city: form.city, phone: form.phone, logo: form.logo || null, coverImage: form.coverImage || null, currency: form.currency,
                    acceptsOrders: form.acceptsOrders, slug: form.slug, location: form.location, theme: form.theme,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            onSaved(json.data);
            setDirty(false); setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 460px', minWidth: 0 }}>
                <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: '1.2rem' }}>
                    {SECTIONS.map(([k, l, Icon]) => (
                        <button key={k} type="button" onClick={() => setSection(k)} className={`chip ${section === k ? 'active' : ''}`}><Icon size={15} /> {l}</button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                        className="card" style={{ background: 'white', borderRadius: 24, padding: 'clamp(1.1rem, 3vw, 1.8rem)' }}>
                        {section === 'infos' && (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <label className="field"><span>Nom du restaurant</span><input className="input" required value={form.name || ''} onChange={set('name')} /></label>
                                <label className="field"><span>Présentation</span><textarea className="input" value={form.description || ''} onChange={set('description')} /></label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                                    <label className="field"><span>Cuisine</span><input className="input" placeholder="Marocaine, burgers…" value={form.cuisine || ''} onChange={set('cuisine')} /></label>
                                    <label className="field"><span>Ville</span><input className="input" value={form.city || ''} onChange={set('city')} /></label>
                                    <label className="field"><span>Téléphone</span><input className="input" value={form.phone || ''} onChange={set('phone')} /></label>
                                    <label className="field"><span>Devise</span><input className="input" maxLength={5} value={form.currency || 'DH'} onChange={set('currency')} /></label>
                                </div>
                                <label className="field"><span>Adresse du menu</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: 'var(--ink-soft)' }}>/r/</span><input className="input" value={form.slug || ''} onChange={set('slug')} /></div>
                                </label>
                                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}>
                                    <input type="checkbox" checked={form.acceptsOrders !== false} onChange={set('acceptsOrders')} style={{ width: 18, height: 18, accentColor: 'var(--glovo-dark)' }} />
                                    Accepter les commandes depuis le menu
                                </label>
                            </div>
                        )}
                        {section === 'look' && <BrandingEditor value={form} onChange={patch} onFile={onFile} />}
                        {section === 'place' && <LocationPicker value={form.location?.lat ? form.location : null} onChange={(location) => patch({ location })} />}
                        {section === 'share' && (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ background: 'white', padding: 14, borderRadius: 18, boxShadow: 'var(--shadow-soft)', border: '1px solid var(--line)' }}><QRCode value={menuUrl} size={140} /></div>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <h3 style={{ marginBottom: 6 }}>Votre menu public</h3>
                                        <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginBottom: 12 }}>QR général pour la vitrine, les flyers et les réseaux. Les QR par table sont dans l’onglet Tables.</p>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <a href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '0.7rem 1.1rem' }}><ExternalLink size={16} /> Ouvrir mon site</a>
                                            <button type="button" onClick={() => navigator.clipboard?.writeText(menuUrl)} className="btn-ghost" style={{ padding: '0.7rem 1.1rem' }}><Copy size={16} /> Copier le lien</button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: '#f6f2ea', borderRadius: 18, padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}><Box size={18} /> Menu en 3D</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{with3d}<span style={{ fontSize: '1rem', color: 'var(--ink-soft)' }}> / {dishes.length} plats</span></div>
                                    <div style={{ height: 8, background: '#e7dfd1', borderRadius: 4, margin: '0.5rem 0' }}>
                                        <div style={{ height: '100%', width: `${dishes.length ? (with3d / dishes.length) * 100 : 0}%`, background: 'var(--glovo-dark)', borderRadius: 4 }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div style={{ position: 'sticky', top: 20, margin: '0 auto' }}>
                <PhonePreview restaurant={form} width={290} />
            </div>

            <AnimatePresence>
                {(dirty || saved) && (
                    <motion.div initial={{ y: 80, x: '-50%', opacity: 0 }} animate={{ y: 0, x: '-50%', opacity: 1 }} exit={{ y: 80, x: '-50%', opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{ position: 'fixed', left: '50%', bottom: 20, zIndex: 900, background: '#1a1a1a', color: 'white', borderRadius: 999, padding: '0.55rem 0.6rem 0.55rem 1.3rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-float)', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{saved ? 'Modifications enregistrées' : 'Modifications non enregistrées'}</span>
                        {saved ? <Check size={20} color="#4ade80" style={{ marginRight: 10 }} /> : (
                            <button type="button" onClick={save} disabled={saving} className="btn-primary" style={{ borderRadius: 999, padding: '0.6rem 1.2rem', boxShadow: 'none' }}>
                                <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
