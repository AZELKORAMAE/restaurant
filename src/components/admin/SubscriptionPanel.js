"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Crown, Check, Upload, Clock, AlertTriangle, CheckCircle2, XCircle, Loader2, Phone, Mail } from 'lucide-react';
import { uploadFile, compressImage } from '@/lib/upload-client';

const STATE = {
    trial: { label: 'Essai gratuit', bg: '#eff6ff', color: '#1d4ed8' },
    active: { label: 'Actif', bg: '#dcfce7', color: '#166534' },
    grace: { label: 'Expiré — délai de grâce', bg: '#fef3c7', color: '#92400e' },
    expired: { label: 'Expiré', bg: '#fee2e2', color: '#991b1b' },
};
const PAY_STATUS = {
    pending: { label: 'En vérification', icon: Loader2, color: '#92400e' },
    validated: { label: 'Validé', icon: CheckCircle2, color: '#166534' },
    rejected: { label: 'Refusé', icon: XCircle, color: '#991b1b' },
};
const METHODS = [['virement', 'Virement bancaire'], ['especes', 'Espèces'], ['cheque', 'Chèque'], ['carte', 'Carte bancaire'], ['autre', 'Autre']];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

export default function SubscriptionPanel({ onChanged }) {
    const [data, setData] = useState(null);
    const [plan, setPlan] = useState('pro');
    const [months, setMonths] = useState(1);
    const [method, setMethod] = useState('virement');
    const [reference, setReference] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');
    const [busy, setBusy] = useState('');
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let alive = true;
        fetch('/api/subscription').then((r) => r.json()).then((json) => {
            if (!alive || !json.success) return;
            setData(json.data);
            setPlan((p) => (version === 0 ? json.data.plan : p));
        });
        return () => { alive = false; };
    }, [version]);
    const reload = useCallback(() => { setVersion((v) => v + 1); onChanged?.(); }, [onChanged]);

    if (!data) return <div className="card" style={{ padding: '2rem' }}>Chargement…</div>;

    const sub = data.subscription;
    const st = STATE[sub.state];
    const selected = data.plans.find((p) => p.key === plan);
    const price = selected?.durations.find((d) => d.months === months)?.price ?? 0;
    const pending = data.payments.find((p) => p.status === 'pending');
    const cur = data.currency;

    const uploadReceipt = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setBusy('receipt');
        try {
            const blob = f.type.startsWith('image/') ? await compressImage(f, { maxSize: 2000 }) : f;
            setReceiptUrl(await uploadFile(blob, { filename: f.name }));
        } catch (err) { alert(err.message); } finally { setBusy(''); }
    };

    const declare = async () => {
        setBusy('declare');
        try {
            const res = await fetch('/api/subscription/payments', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, months, method, reference, receiptUrl }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            setReference(''); setReceiptUrl('');
            reload();
        } catch (err) { alert(err.message); } finally { setBusy(''); }
    };

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Status */}
            <div className="card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Crown size={20} color="#b45309" />
                        <strong style={{ fontSize: '1.3rem' }}>Offre {data.plans.find((p) => p.key === data.plan)?.name}</strong>
                        <span style={{ background: st.bg, color: st.color, fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>{st.label}</span>
                    </div>
                    <div style={{ color: 'var(--glovo-gray)', fontSize: '0.9rem' }}>
                        {sub.state === 'expired' ? 'Votre menu est hors ligne et votre espace est limité.'
                            : sub.state === 'grace' ? `Renouvelez avant le ${fmt(sub.graceEndsAt)} pour éviter la suspension.`
                                : `${sub.state === 'trial' ? 'Essai' : 'Abonnement'} valable jusqu’au ${fmt(sub.endsAt)}`}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, color: sub.daysLeft <= 7 ? '#b45309' : 'var(--glovo-dark)' }}>
                        {Math.max(0, sub.daysLeft)}<span style={{ fontSize: '1rem', color: 'var(--glovo-gray)', fontWeight: 600 }}> jours restants</span>
                    </div>
                    <div style={{ height: 8, background: '#eee', borderRadius: 4, marginTop: 10 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, Math.max(3, (sub.daysLeft / 30) * 100))}%`, background: sub.daysLeft <= 7 ? '#f59e0b' : '#10b981', borderRadius: 4 }} />
                    </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--glovo-gray)', display: 'grid', gap: 4 }}>
                    <span>Plats : <strong style={{ color: 'var(--glovo-dark)' }}>{data.usage.dishes}{data.access.maxDishes != null ? ` / ${data.access.maxDishes}` : ''}</strong></span>
                    <span>Plats en 3D : <strong style={{ color: 'var(--glovo-dark)' }}>{data.usage.dishes3d}{data.access.max3d != null ? ` / ${data.access.max3d}` : ''}</strong></span>
                    {data.access.restrictions?.note && <span style={{ color: '#b45309' }}>Note de l’administrateur : {data.access.restrictions.note}</span>}
                </div>
            </div>

            {/* Plans */}
            <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Renouveler ou changer d’offre</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                    {data.plans.map((p) => (
                        <button key={p.key} type="button" onClick={() => setPlan(p.key)} className="card" style={{
                            padding: '1.3rem', textAlign: 'left', cursor: 'pointer',
                            border: plan === p.key ? `2px solid ${p.key === 'premium' ? '#FFC244' : 'var(--glovo-dark)'}` : '2px solid transparent',
                            background: p.key === 'premium' ? 'linear-gradient(160deg,#1a1a1a,#3a2d14)' : 'white',
                            color: p.key === 'premium' ? 'white' : 'var(--glovo-dark)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '1.1rem' }}>{p.name}</strong>
                                {data.plan === p.key && <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--glovo-yellow)', color: '#1a1a1a', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>Actuelle</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.75, margin: '4px 0 10px' }}>{p.tagline}</div>
                            <div style={{ fontSize: '1.7rem', fontWeight: 900 }}>{p.monthlyPrice} {cur}<span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7 }}> / mois</span></div>
                            <ul style={{ listStyle: 'none', marginTop: 10, display: 'grid', gap: 4, fontSize: '0.85rem' }}>
                                {p.perks.map((perk) => <li key={perk} style={{ display: 'flex', gap: 6 }}><Check size={15} color={p.key === 'premium' ? '#FFC244' : '#10b981'} style={{ flexShrink: 0, marginTop: 3 }} />{perk}</li>)}
                            </ul>
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment */}
            <div className="card" style={{ padding: '1.5rem' }}>
                {pending ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Clock size={28} color="#b45309" />
                        <div>
                            <strong>Paiement en cours de vérification</strong>
                            <div style={{ color: 'var(--glovo-gray)', fontSize: '0.9rem' }}>{pending.amount} {pending.currency} — {pending.months} mois — déclaré le {fmt(pending.createdAt)}. Votre abonnement sera prolongé dès validation.</div>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Payer l’offre {selected?.name}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {selected?.durations.map((d) => (
                                <button key={d.months} type="button" onClick={() => setMonths(d.months)} style={{
                                    padding: '0.6rem 1rem', borderRadius: '0.8rem', fontWeight: 700, fontSize: '0.9rem',
                                    border: months === d.months ? '2px solid var(--glovo-dark)' : '1px solid #ddd', background: months === d.months ? '#fffbeb' : 'white',
                                }}>
                                    {d.months} mois · {d.price} {cur}{d.months === 12 ? ' (2 mois offerts)' : ''}
                                </button>
                            ))}
                        </div>
                        {data.paymentInstructions && (
                            <div style={{ whiteSpace: 'pre-wrap', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '0.8rem', padding: '1rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                {data.paymentInstructions}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                            <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ padding: '0.8rem', borderRadius: '0.6rem', border: '1px solid #ddd' }}>
                                {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence du virement / reçu" style={{ padding: '0.8rem', borderRadius: '0.6rem', border: '1px solid #ddd' }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.8rem', borderRadius: '0.6rem', border: '1px dashed #ccc', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <Upload size={16} /> {busy === 'receipt' ? 'Envoi…' : receiptUrl ? 'Justificatif ajouté ✓' : 'Joindre le justificatif'}
                                <input type="file" hidden accept="image/*,application/pdf" onChange={uploadReceipt} />
                            </label>
                        </div>
                        <button type="button" className="btn-primary" onClick={declare} disabled={busy === 'declare'} style={{ justifyContent: 'center' }}>
                            {busy === 'declare' ? 'Envoi…' : `J’ai payé ${price} ${cur} — envoyer pour validation`}
                        </button>
                        {(data.contact.phone || data.contact.email) && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--glovo-gray)', flexWrap: 'wrap' }}>
                                Une question ?
                                {data.contact.phone && <a href={`tel:${data.contact.phone}`} style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Phone size={14} /> {data.contact.phone}</a>}
                                {data.contact.email && <a href={`mailto:${data.contact.email}`} style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Mail size={14} /> {data.contact.email}</a>}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* History */}
            {data.payments.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Historique</h3>
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                        {data.payments.map((p) => {
                            const ps = PAY_STATUS[p.status];
                            const Icon = ps.icon;
                            return (
                                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '0.7rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                                    <span>{fmt(p.createdAt)} · {data.plans.find((x) => x.key === p.plan)?.name} · {p.months ? `${p.months} mois` : ''}{p.days ? ` ${p.days} j` : ''}</span>
                                    <span style={{ fontWeight: 700 }}>{p.amount} {p.currency}</span>
                                    <span style={{ color: ps.color, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><Icon size={15} /> {ps.label}{p.periodEnd ? ` · jusqu’au ${fmt(p.periodEnd)}` : ''}</span>
                                    {p.status === 'rejected' && p.note && <span style={{ width: '100%', color: '#991b1b', fontSize: '0.8rem' }}>Motif : {p.note}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {sub.state === 'expired' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#991b1b', fontSize: '0.9rem' }}>
                    <AlertTriangle size={18} /> Les modifications du menu sont bloquées jusqu’au renouvellement. Vos commandes restent consultables.
                </div>
            )}
        </div>
    );
}
