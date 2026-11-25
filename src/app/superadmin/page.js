"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { CheckCircle2, XCircle, PauseCircle, PlayCircle, LogOut, ExternalLink, Box, ShoppingBag, UtensilsCrossed, Trash2, Wrench } from 'lucide-react';

const STATUS = {
    pending: { label: 'En attente', bg: '#fef3c7', color: '#92400e' },
    approved: { label: 'Validé', bg: '#dcfce7', color: '#166534' },
    rejected: { label: 'Refusé', bg: '#fee2e2', color: '#991b1b' },
    suspended: { label: 'Suspendu', bg: '#e5e7eb', color: '#374151' },
};
const FILTERS = [['pending', 'Demandes'], ['approved', 'Validés'], ['suspended', 'Suspendus'], ['rejected', 'Refusés'], ['all', 'Tous']];

const btn = (bg, color = 'white') => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 0.9rem', borderRadius: '0.7rem', background: bg, color, fontWeight: 700, fontSize: '0.85rem' });

export default function SuperAdminPage() {
    const [data, setData] = useState({ restaurants: [], orphans: 0 });
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState('');

    const [version, setVersion] = useState(0);
    const load = useCallback(() => setVersion((v) => v + 1), []);

    useEffect(() => {
        let alive = true;
        fetch('/api/superadmin/restaurants').then((res) => res.json()).then((json) => {
            if (!alive) return;
            if (json.success) setData(json.data);
            setLoading(false);
        });
        return () => { alive = false; };
    }, [version]);

    const act = async (r, action) => {
        let note;
        if (action === 'reject' || action === 'suspend') {
            note = prompt(action === 'reject' ? 'Motif du refus (optionnel) :' : 'Motif de la suspension (optionnel) :');
            if (note === null) return;
        }
        setBusy(r._id + action);
        const res = await fetch(`/api/superadmin/restaurants/${r._id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }),
        });
        const json = await res.json();
        setBusy('');
        if (!json.success) return alert(json.error);
        load();
    };

    const remove = async (r) => {
        if (!confirm(`Supprimer définitivement la demande « ${r.name} » et le compte du gérant ?`)) return;
        const res = await fetch(`/api/superadmin/restaurants/${r._id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) return alert(json.error);
        load();
    };

    const maintenance = async (body, confirmText) => {
        if (confirmText && !confirm(confirmText)) return;
        setBusy('maintenance');
        const res = await fetch('/api/superadmin/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json();
        setBusy('');
        if (!json.success) return alert(json.error);
        alert('Terminé : ' + JSON.stringify(json.data));
        load();
    };

    const list = data.restaurants.filter((r) => filter === 'all' || r.status === filter);
    const count = (s) => data.restaurants.filter((r) => r.status === s).length;
    const approved = data.restaurants.filter((r) => r.status === 'approved');

    return (
        <main style={{ minHeight: '100vh', background: '#f9fafb' }}>
            <header style={{ background: 'var(--glovo-dark)', color: 'white', padding: '1rem 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.1rem' }}>Super Admin <span style={{ color: 'var(--glovo-yellow)' }}>· Plateforme</span></strong>
                    <button onClick={() => signOut({ callbackUrl: '/' })} style={{ color: '#d1d5db', display: 'flex', gap: 6, alignItems: 'center' }}><LogOut size={18} /> Déconnexion</button>
                </div>
            </header>

            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        ['Demandes en attente', count('pending'), '#f59e0b'],
                        ['Restaurants actifs', count('approved'), '#10b981'],
                        ['Plats en 3D', approved.reduce((t, r) => t + r.stats.dishes3d, 0), '#8b5cf6'],
                        ['Commandes', approved.reduce((t, r) => t + r.stats.orders, 0), '#3b82f6'],
                    ].map(([label, value, color]) => (
                        <div key={label} className="card" style={{ padding: '1.2rem', borderTop: `4px solid ${color}` }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', fontWeight: 600 }}>{label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{value}</div>
                        </div>
                    ))}
                </div>

                {data.orphans > 0 && (
                    <div className="card" style={{ padding: '1.2rem', marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}><Wrench size={18} /> Données de l’ancienne version</div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--glovo-gray)', marginBottom: '0.8rem' }}>
                            {data.orphans} plats/commandes ont été créés avant la plateforme multi-restaurants. Rattachez-les à un restaurant validé :
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {approved.map((r) => (
                                <button key={r._id} disabled={busy === 'maintenance'} onClick={() => maintenance({ action: 'assign-orphans', restaurantId: r._id }, `Rattacher toutes les anciennes données à « ${r.name} » ?`)} style={btn('#f3f4f6', 'var(--glovo-dark)')}>{r.name}</button>
                            ))}
                            {approved.length === 0 && <span style={{ fontSize: '0.85rem' }}>Validez d’abord un restaurant.</span>}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', alignItems: 'center' }}>
                    {FILTERS.map(([key, label]) => (
                        <button key={key} onClick={() => setFilter(key)} style={{
                            padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap',
                            background: filter === key ? 'var(--glovo-dark)' : 'white', color: filter === key ? 'white' : 'var(--glovo-dark)', border: '1px solid #e5e7eb'
                        }}>
                            {label}{key !== 'all' ? ` (${count(key)})` : ''}
                        </button>
                    ))}
                    <button onClick={() => maintenance({ action: 'sync-indexes' })} disabled={busy === 'maintenance'} title="Reconstruit les index de la base" style={{ marginLeft: 'auto', color: 'var(--glovo-gray)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <Wrench size={14} /> Index
                    </button>
                </div>

                {loading ? <p>Chargement…</p> : list.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--glovo-gray)' }}>Aucun restaurant dans cette catégorie.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {list.map((r) => {
                            const st = STATUS[r.status];
                            return (
                                <div key={r._id} className="card" style={{ padding: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                            <strong style={{ fontSize: '1.1rem' }}>{r.name}</strong>
                                            <span style={{ background: st.bg, color: st.color, fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '1rem' }}>{st.label}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--glovo-gray)' }}>
                                            {[r.cuisine, r.city, r.address].filter(Boolean).join(' · ') || '—'}
                                        </div>
                                        {r.description && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{r.description}</p>}
                                        <div style={{ fontSize: '0.85rem', marginTop: 8 }}>
                                            <strong>{r.owner?.name}</strong> · {r.owner?.email} · {r.owner?.phone}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--glovo-gray)', marginTop: 4 }}>
                                            Demande du {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                                            {r.reviewNote ? ` · Note : ${r.reviewNote}` : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'flex-end' }}>
                                        {r.status === 'approved' && (
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--glovo-gray)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><UtensilsCrossed size={14} /> {r.stats.dishes}</span>
                                                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Box size={14} /> {r.stats.dishes3d} en 3D</span>
                                                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><ShoppingBag size={14} /> {r.stats.orders}</span>
                                                <a href={`/r/${r.slug}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 4, alignItems: 'center', fontWeight: 700, color: 'var(--glovo-dark)' }}><ExternalLink size={14} /> Menu</a>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {r.status !== 'approved' && (
                                                <button disabled={!!busy} onClick={() => act(r, 'approve')} style={btn('#16a34a')}>
                                                    {r.status === 'suspended' ? <PlayCircle size={16} /> : <CheckCircle2 size={16} />} {r.status === 'suspended' ? 'Réactiver' : 'Valider'}
                                                </button>
                                            )}
                                            {r.status === 'pending' && <button disabled={!!busy} onClick={() => act(r, 'reject')} style={btn('#dc2626')}><XCircle size={16} /> Refuser</button>}
                                            {r.status === 'approved' && <button disabled={!!busy} onClick={() => act(r, 'suspend')} style={btn('#4b5563')}><PauseCircle size={16} /> Suspendre</button>}
                                            {r.status !== 'approved' && <button onClick={() => remove(r)} style={btn('#f3f4f6', '#991b1b')} aria-label="Supprimer"><Trash2 size={16} /></button>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
