"use client";
import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Save, ExternalLink, Upload, Copy, Box } from 'lucide-react';
import { uploadFile, compressImage } from '@/lib/upload-client';

const input = { width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' };
const label = { display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' };

export default function RestaurantSettings({ restaurant, dishes = [], onSaved }) {
    const [form, setForm] = useState(restaurant);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState('');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const menuUrl = `${origin}/r/${restaurant.slug}`;
    const with3d = dishes.filter(d => d.model3d?.status === 'ready').length;

    const upload = async (e, key) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(key);
        try {
            const url = await uploadFile(await compressImage(file, { maxSize: key === 'logo' ? 600 : 2000 }), { filename: `${key}.jpg` });
            setForm(f => ({ ...f, [key]: url }));
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading('');
        }
    };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/restaurant', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            onSaved(json.data);
            alert('Restaurant mis à jour !');
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            <form onSubmit={save} className="card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                <div style={{ position: 'relative', height: 140, borderRadius: '1rem', overflow: 'hidden', background: form.coverImage ? `center/cover url("${form.coverImage}")` : 'linear-gradient(135deg,#1a1a1a,#444)' }}>
                    <label style={{ position: 'absolute', right: 10, bottom: 10, background: 'white', borderRadius: '1rem', padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Upload size={14} /> {uploading === 'coverImage' ? '...' : 'Couverture'}
                        <input type="file" hidden accept="image/*" onChange={(e) => upload(e, 'coverImage')} />
                    </label>
                    <label style={{ position: 'absolute', left: 14, bottom: 10, width: 64, height: 64, borderRadius: '50%', background: form.logo ? `center/cover url("${form.logo}")` : 'var(--glovo-yellow)', border: '3px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                        {!form.logo && (uploading === 'logo' ? '...' : 'LOGO')}
                        <input type="file" hidden accept="image/*" onChange={(e) => upload(e, 'logo')} />
                    </label>
                </div>
                <div><label style={label}>Nom du restaurant</label><input style={input} required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label style={label}>Description</label><textarea style={{ ...input, height: 80 }} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div><label style={label}>Cuisine</label><input style={input} placeholder="Marocaine, burgers…" value={form.cuisine || ''} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} /></div>
                    <div><label style={label}>Devise</label><input style={input} value={form.currency || 'DH'} maxLength={5} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
                    <div><label style={label}>Ville</label><input style={input} value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                    <div><label style={label}>Téléphone</label><input style={input} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div><label style={label}>Adresse</label><input style={input} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div>
                    <label style={label}>Adresse du menu</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--glovo-gray)', whiteSpace: 'nowrap' }}>/r/</span>
                        <input style={input} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                    </div>
                </div>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                    <input type="checkbox" checked={form.acceptsOrders !== false} onChange={(e) => setForm({ ...form, acceptsOrders: e.target.checked })} />
                    Accepter les commandes depuis le menu
                </label>
                <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
                    <Save size={18} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </form>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Votre menu public</h3>
                    <p style={{ color: 'var(--glovo-gray)', fontSize: '0.85rem', marginBottom: '1rem' }}>QR général (vitrine, flyers, réseaux). Les QR par table sont dans l’onglet Tables.</p>
                    <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <QRCode value={menuUrl} size={160} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <a href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '0.6rem 1rem' }}><ExternalLink size={16} /> Ouvrir</a>
                        <button onClick={() => navigator.clipboard?.writeText(menuUrl)} style={{ padding: '0.6rem 1rem', border: '1px solid #ddd', borderRadius: 'var(--radius-xl)', display: 'flex', gap: 6, alignItems: 'center' }}><Copy size={16} /> Copier le lien</button>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.8rem', display: 'flex', gap: 8, alignItems: 'center' }}><Box size={20} /> Menu en 3D</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{with3d}<span style={{ fontSize: '1rem', color: 'var(--glovo-gray)' }}> / {dishes.length} plats</span></div>
                    <div style={{ height: 8, background: '#eee', borderRadius: 4, margin: '0.6rem 0' }}>
                        <div style={{ height: '100%', width: `${dishes.length ? (with3d / dishes.length) * 100 : 0}%`, background: '#8b5cf6', borderRadius: 4 }} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--glovo-gray)' }}>Les clients peuvent poser ces plats sur leur table avec la caméra de leur téléphone. Ouvrez un plat dans l’onglet Plats pour le scanner.</p>
                </div>
            </div>
        </div>
    );
}
