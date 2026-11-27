"use client";
import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Search, LocateFixed, Link2, MapPin, Loader2, ExternalLink, Check } from 'lucide-react';
import { mapsLinks } from '@/lib/theme';

const DEFAULT_CENTER = [31.6295, -7.9811]; // Marrakech

async function geocode(params) {
    const res = await fetch(`/api/geocode?${new URLSearchParams(params)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

/**
 * Restaurant location: address search, draggable pin on a map, "my position",
 * or a link pasted from Google Maps. Shows the Google Maps preview of the chosen point.
 * value / onChange: { lat, lng, address, mapsUrl }
 */
export default function LocationPicker({ value, onChange, height = 320 }) {
    const mapEl = useRef(null);
    const map = useRef(null);
    const marker = useRef(null);
    const L = useRef(null);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [link, setLink] = useState('');
    const [showGoogle, setShowGoogle] = useState(false);
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    const pinIcon = (Lf) => Lf.divIcon({
        className: '',
        html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#1a1a1a;border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.35)"></div>',
        iconSize: [34, 34], iconAnchor: [17, 34],
    });

    const place = async (lat, lng, extra = {}) => {
        const next = { lat, lng, address: extra.address ?? value?.address ?? '', mapsUrl: extra.mapsUrl };
        onChangeRef.current(next);
        if (!extra.address) {
            try {
                const [r] = await geocode({ lat, lng });
                if (r?.address) onChangeRef.current({ ...next, address: r.address });
            } catch { /* keep coordinates only */ }
        }
    };

    // Map
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const Lf = (await import('leaflet')).default;
            if (cancelled || !mapEl.current || map.current) return;
            L.current = Lf;
            const start = value?.lat ? [value.lat, value.lng] : DEFAULT_CENTER;
            const m = Lf.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView(start, value?.lat ? 17 : 13);
            Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19, attribution: '&copy; OpenStreetMap',
            }).addTo(m);
            const mk = Lf.marker(start, { draggable: true, icon: pinIcon(Lf), opacity: value?.lat ? 1 : 0 }).addTo(m);
            mk.on('dragend', () => { const p = mk.getLatLng(); place(p.lat, p.lng); });
            m.on('click', (e) => { mk.setLatLng(e.latlng).setOpacity(1); place(e.latlng.lat, e.latlng.lng); });
            map.current = m;
            marker.current = mk;
        })();
        return () => { cancelled = true; map.current?.remove(); map.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Follow external changes (search result, link, geolocation)
    useEffect(() => {
        if (!map.current || !value?.lat) return;
        marker.current.setLatLng([value.lat, value.lng]).setOpacity(1);
        map.current.setView([value.lat, value.lng], Math.max(map.current.getZoom(), 16), { animate: true });
    }, [value?.lat, value?.lng]);

    // Address search (debounced)
    useEffect(() => {
        if (q.trim().length < 3) { setResults([]); return; }
        const t = setTimeout(async () => {
            setBusy('search');
            try { setResults(await geocode({ q })); setError(''); } catch (e) { setError(e.message); } finally { setBusy(''); }
        }, 500);
        return () => clearTimeout(t);
    }, [q]);

    const choose = (r) => { setResults([]); setQ(''); place(r.lat, r.lng, { address: r.address }); };

    const locate = () => {
        if (!navigator.geolocation) return setError('La géolocalisation n’est pas disponible sur cet appareil.');
        setBusy('locate');
        navigator.geolocation.getCurrentPosition(
            (pos) => { setBusy(''); place(pos.coords.latitude, pos.coords.longitude); },
            () => { setBusy(''); setError('Position refusée. Cherchez l’adresse ou placez le repère sur la carte.'); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const useLink = async () => {
        if (!link.trim()) return;
        setBusy('link');
        try {
            const [r] = await geocode({ url: link.trim() });
            place(r.lat, r.lng, { address: r.address, mapsUrl: r.mapsUrl });
            setLink(''); setError('');
        } catch (e) { setError(e.message); } finally { setBusy(''); }
    };

    const maps = mapsLinks(value);

    return (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
                <input className="input" style={{ paddingLeft: 42 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher l’adresse du restaurant…" />
                {busy === 'search' && <Loader2 size={18} className="spin-slow" style={{ position: 'absolute', right: 14, top: 14 }} />}
                {results.length > 0 && (
                    <div className="card" style={{ position: 'absolute', zIndex: 1000, top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', borderRadius: 14, overflow: 'hidden' }}>
                        {results.map((r) => (
                            <button type="button" key={`${r.lat},${r.lng}`} onClick={() => choose(r)} style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: '0.7rem 0.9rem', borderBottom: '1px solid var(--line)', fontSize: '0.88rem' }}>
                                <MapPin size={16} style={{ flexShrink: 0, marginTop: 3, color: 'var(--gold)' }} /> {r.address}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)' }}>
                <div ref={mapEl} style={{ height, width: '100%', background: '#e9e4da' }} />
                <button type="button" onClick={locate} className="btn-ghost" style={{ position: 'absolute', zIndex: 500, right: 10, bottom: 10, padding: '0.55rem 0.9rem', fontSize: '0.82rem' }}>
                    {busy === 'locate' ? <Loader2 size={15} className="spin-slow" /> : <LocateFixed size={15} />} Ma position
                </button>
                {!value?.lat && (
                    <div style={{ position: 'absolute', zIndex: 500, left: 10, top: 10, background: 'white', borderRadius: 12, padding: '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, boxShadow: 'var(--shadow-soft)' }}>
                        Touchez la carte pour placer votre restaurant
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Link2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
                    <input className="input" style={{ paddingLeft: 40 }} value={link} onChange={(e) => setLink(e.target.value)} placeholder="…ou collez le lien Google Maps (Partager → Copier le lien)" />
                </div>
                <button type="button" className="btn-ghost" onClick={useLink} disabled={!link.trim() || busy === 'link'} style={{ padding: '0 1rem' }}>
                    {busy === 'link' ? <Loader2 size={16} className="spin-slow" /> : 'Utiliser'}
                </button>
            </div>

            {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.6rem 0.9rem', borderRadius: 12, fontSize: '0.85rem' }}>{error}</div>}

            {value?.lat && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f4f1ea', borderRadius: 14, padding: '0.8rem 1rem', fontSize: '0.88rem' }}>
                    <Check size={18} style={{ color: '#15803d', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{value.address || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}</div>
                        <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setShowGoogle((v) => !v)} style={{ fontWeight: 700, textDecoration: 'underline', fontSize: '0.82rem' }}>
                                {showGoogle ? 'Masquer' : 'Voir'} l’aperçu Google Maps
                            </button>
                            <a href={maps.open} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', gap: 4, alignItems: 'center' }}>Ouvrir dans Google Maps <ExternalLink size={12} /></a>
                        </div>
                    </div>
                </div>
            )}
            {value?.lat && showGoogle && (
                <iframe title="Aperçu Google Maps" src={maps.embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    style={{ width: '100%', height: 240, border: 0, borderRadius: 18 }} />
            )}
        </div>
    );
}
