"use client";
import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import {
    Inbox, Store, Wallet, Settings, LogOut, CheckCircle2, XCircle, PauseCircle, PlayCircle, ExternalLink, Box,
    ShoppingBag, UtensilsCrossed, Trash2, Wrench, Send, MessageCircle, Mail, Copy, X, Crown, LayoutDashboard, Lock, FileText,
} from 'lucide-react';

const STATUS = {
    pending: { label: 'En attente', bg: '#fef3c7', color: '#92400e' },
    approved: { label: 'Validé', bg: '#dcfce7', color: '#166534' },
    rejected: { label: 'Refusé', bg: '#fee2e2', color: '#991b1b' },
    suspended: { label: 'Suspendu', bg: '#e5e7eb', color: '#374151' },
};
const SUB = {
    trial: { label: 'Essai', bg: '#eff6ff', color: '#1d4ed8' },
    active: { label: 'Payé', bg: '#dcfce7', color: '#166534' },
    grace: { label: 'Délai de grâce', bg: '#fef3c7', color: '#92400e' },
    expired: { label: 'Expiré', bg: '#fee2e2', color: '#991b1b' },
};
const PLAN_NAMES = { essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium' };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const chip = (s) => ({ background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '1rem', whiteSpace: 'nowrap' });
const btn = (bg, color = 'white') => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 0.9rem', borderRadius: '0.7rem', background: bg, color, fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' });
const input = { width: '100%', padding: '0.7rem 0.8rem', borderRadius: '0.6rem', border: '1px solid #ddd' };

async function api(url, method = 'GET', body) {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
}

function Modal({ title, onClose, children, width = 560 }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '1.2rem', width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h2 style={{ fontSize: '1.3rem' }}>{title}</h2>
                    <button onClick={onClose} aria-label="Fermer"><X size={22} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

/** Sends the access link to the manager: e-mail (automatic when configured), WhatsApp, e-mail app, copy. */
function ShareModal({ share, restaurant, onClose }) {
    const [copied, setCopied] = useState(false);
    return (
        <Modal title="Envoyer l’accès au gérant" onClose={onClose}>
            <p style={{ marginBottom: '1rem', color: 'var(--glovo-gray)' }}>
                {restaurant.name} est validé.{' '}
                {share.emailSent ? <strong style={{ color: '#166534' }}>Le lien a été envoyé automatiquement par e-mail.</strong>
                    : share.mailConfigured ? 'L’e-mail automatique n’a pas pu partir : envoyez le lien ci-dessous.'
                        : 'Envoyez-lui son lien de connexion :'}
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f9fafb', border: '1px solid #eee', borderRadius: '0.8rem', padding: '1rem', fontSize: '0.85rem', fontFamily: 'inherit', marginBottom: '1rem' }}>{share.message}</pre>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {share.whatsapp && <a href={share.whatsapp} target="_blank" rel="noreferrer" style={btn('#25D366')}><MessageCircle size={16} /> WhatsApp</a>}
                <a href={share.mailto} style={btn('#1a1a1a')}><Mail size={16} /> E-mail</a>
                <button onClick={() => { navigator.clipboard?.writeText(share.message); setCopied(true); }} style={btn('#f3f4f6', '#1a1a1a')}><Copy size={16} /> {copied ? 'Copié !' : 'Copier le message'}</button>
            </div>
        </Modal>
    );
}

/** Subscription, plan and restrictions of one restaurant. */
function ManageModal({ restaurant, onClose, onSaved }) {
    const [plan, setPlan] = useState(restaurant.plan || 'pro');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('especes');
    const [r, setR] = useState({ readOnly: false, ordersDisabled: false, threeDDisabled: false, maxDishes: '', note: '', ...(restaurant.restrictions || {}) });
    const [busy, setBusy] = useState(false);
    const sub = restaurant.subscription;

    const run = async (body, msg) => {
        setBusy(true);
        try {
            await api(`/api/superadmin/restaurants/${restaurant._id}`, 'PATCH', body);
            onSaved(msg);
        } catch (e) { alert(e.message); } finally { setBusy(false); }
    };
    const extend = (addMonths, addDays = 0) => run({ action: 'subscription', plan, addMonths, addDays, amount: Number(amount) || 0, method: Number(amount) ? method : 'offert' }, 'Abonnement prolongé.');

    return (
        <Modal title={`Abonnement & accès — ${restaurant.name}`} onClose={onClose} width={640}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                <span style={chip(SUB[sub.state])}>{SUB[sub.state].label}</span>
                <span style={{ fontSize: '0.9rem' }}>{sub.state === 'expired' ? `Expiré depuis le ${fmt(sub.endsAt)}` : `Jusqu’au ${fmt(sub.endsAt)} (${sub.daysLeft} j)`}</span>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '0.6rem' }}>Offre</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                {Object.entries(PLAN_NAMES).map(([k, n]) => (
                    <button key={k} onClick={() => setPlan(k)} style={{ ...btn(plan === k ? '#1a1a1a' : '#f3f4f6', plan === k ? 'white' : '#1a1a1a') }}>{n}</button>
                ))}
                {plan !== restaurant.plan && <button disabled={busy} onClick={() => run({ action: 'subscription', plan }, 'Offre modifiée.')} style={btn('#16a34a')}>Enregistrer l’offre</button>}
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '0.6rem' }}>Prolonger (paiement reçu en main propre, geste commercial…)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <input style={input} type="number" min="0" placeholder="Montant encaissé (optionnel)" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <select style={input} value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="especes">Espèces</option><option value="virement">Virement</option><option value="cheque">Chèque</option><option value="carte">Carte</option>
                </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
                <button disabled={busy} onClick={() => extend(0, 7)} style={btn('#f3f4f6', '#1a1a1a')}>+7 jours</button>
                <button disabled={busy} onClick={() => extend(1)} style={btn('#1a1a1a')}>+1 mois</button>
                <button disabled={busy} onClick={() => extend(3)} style={btn('#1a1a1a')}>+3 mois</button>
                <button disabled={busy} onClick={() => extend(12)} style={btn('#1a1a1a')}>+12 mois</button>
                <button disabled={busy} onClick={() => confirm('Terminer l’essai maintenant ?') && run({ action: 'subscription', endTrial: true }, 'Essai terminé.')} style={btn('#fee2e2', '#991b1b')}>Terminer l’essai</button>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '0.6rem', display: 'flex', gap: 6, alignItems: 'center' }}><Lock size={16} /> Restreindre l’accès du gérant</h3>
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.8rem' }}>
                {[['readOnly', 'Lecture seule (aucune modification du menu)'], ['ordersDisabled', 'Désactiver les commandes en ligne'], ['threeDDisabled', 'Désactiver la 3D et la réalité augmentée']].map(([k, l]) => (
                    <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="checkbox" checked={Boolean(r[k])} onChange={(e) => setR({ ...r, [k]: e.target.checked })} /> {l}
                    </label>
                ))}
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    Nombre maximum de plats
                    <input style={{ ...input, width: 110 }} type="number" min="0" placeholder="Offre" value={r.maxDishes ?? ''} onChange={(e) => setR({ ...r, maxDishes: e.target.value })} />
                </label>
                <input style={input} placeholder="Message affiché au gérant (optionnel)" value={r.note || ''} onChange={(e) => setR({ ...r, note: e.target.value })} />
            </div>
            <button disabled={busy} onClick={() => run({ action: 'restrictions', restrictions: r }, 'Restrictions enregistrées.')} className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                Enregistrer les restrictions
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginTop: '0.8rem' }}>
                Pour bloquer complètement l’accès (connexion impossible), utilisez « Suspendre ».
            </p>
        </Modal>
    );
}

function SettingsTab() {
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => { api('/api/superadmin/settings').then(setData).catch((e) => alert(e.message)); }, []);
    if (!data) return <p>Chargement…</p>;
    const s = data.settings;
    const set = (patch) => setData({ ...data, settings: { ...s, ...patch } });
    const save = async () => {
        setBusy(true);
        try {
            const saved = await api('/api/superadmin/settings', 'PATCH', s);
            setData({ ...data, settings: saved });
            alert('Paramètres enregistrés.');
        } catch (e) { alert(e.message); } finally { setBusy(false); }
    };
    const field = (label, el) => <label style={{ display: 'grid', gap: 4, fontWeight: 600, fontSize: '0.9rem' }}>{label}{el}</label>;
    return (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 820 }}>
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Offres et prix (par mois)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {data.plans.map((p) => field(`${p.name} (${s.currency})`, <input key={p.key} style={input} type="number" min="0" value={s.prices[p.key] ?? ''} onChange={(e) => set({ prices: { ...s.prices, [p.key]: e.target.value } })} />))}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginTop: 8 }}>L’abonnement annuel offre automatiquement 2 mois.</p>
            </div>
            <div className="card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {field('Essai gratuit (jours)', <input style={input} type="number" value={s.trialDays} onChange={(e) => set({ trialDays: e.target.value })} />)}
                {field('Délai de grâce (jours)', <input style={input} type="number" value={s.graceDays} onChange={(e) => set({ graceDays: e.target.value })} />)}
                {field('Alerte avant expiration (jours)', <input style={input} type="number" value={s.reminderDays} onChange={(e) => set({ reminderDays: e.target.value })} />)}
                {field('Offre à la validation', <select style={input} value={s.defaultPlan} onChange={(e) => set({ defaultPlan: e.target.value })}>{data.plans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</select>)}
                {field('Devise', <input style={input} value={s.currency} onChange={(e) => set({ currency: e.target.value })} />)}
                {field('Indicatif WhatsApp', <input style={input} value={s.countryCode} onChange={(e) => set({ countryCode: e.target.value })} />)}
            </div>
            <div className="card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                {field('Instructions de paiement (RIB, bénéficiaire…)', <textarea style={{ ...input, height: 110 }} value={s.paymentInstructions} onChange={(e) => set({ paymentInstructions: e.target.value })} placeholder={'Virement à : …\nRIB : …\nRéférence : nom du restaurant'} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {field('Téléphone de contact', <input style={input} value={s.contactPhone || ''} onChange={(e) => set({ contactPhone: e.target.value })} />)}
                    {field('E-mail de contact', <input style={input} value={s.contactEmail || ''} onChange={(e) => set({ contactEmail: e.target.value })} />)}
                </div>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.8rem' }}>Services connectés</h3>
                {[['mail', 'E-mails automatiques (RESEND_API_KEY + MAIL_FROM)'], ['kiri', 'Scan 3D photogrammétrique — KIRI Engine (KIRI_API_KEY)'], ['meshy', 'Reconstruction 3D par IA — Meshy (MESHY_API_KEY)']].map(([k, l]) => (
                    <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0.3rem 0' }}>
                        {data.services[k] ? <CheckCircle2 size={18} color="#16a34a" /> : <XCircle size={18} color="#9ca3af" />} {l}
                    </div>
                ))}
            </div>
            <button className="btn-primary" disabled={busy} onClick={save} style={{ justifyContent: 'center' }}>{busy ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button>
        </div>
    );
}

function PaymentsTab({ onChanged }) {
    const [list, setList] = useState(null);
    const [version, setVersion] = useState(0);
    useEffect(() => { api('/api/superadmin/payments').then(setList).catch((e) => alert(e.message)); }, [version]);
    if (!list) return <p>Chargement…</p>;
    const act = async (p, action) => {
        let note;
        if (action === 'reject') { note = prompt('Motif du refus :'); if (note === null) return; }
        try { await api(`/api/superadmin/payments/${p._id}`, 'PATCH', { action, note }); setVersion((v) => v + 1); onChanged(); } catch (e) { alert(e.message); }
    };
    const pending = list.filter((p) => p.status === 'pending');
    const done = list.filter((p) => p.status !== 'pending');
    const Row = ({ p }) => (
        <div className="card" style={{ padding: '1rem 1.2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
                <strong>{p.restaurant?.name || '—'}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--glovo-gray)' }}>
                    {PLAN_NAMES[p.plan]} · {p.months ? `${p.months} mois` : ''}{p.days ? ` ${p.days} j` : ''} · {p.method} {p.reference ? `· réf. ${p.reference}` : ''} · {fmt(p.createdAt)}{p.declaredBy === 'admin' ? ' · saisi par l’admin' : ''}
                </div>
            </div>
            <strong style={{ fontSize: '1.1rem' }}>{p.amount} {p.currency}</strong>
            {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer" style={btn('#f3f4f6', '#1a1a1a')}><FileText size={15} /> Justificatif</a>}
            {p.status === 'pending' ? (
                <>
                    <button onClick={() => act(p, 'validate')} style={btn('#16a34a')}><CheckCircle2 size={16} /> Valider</button>
                    <button onClick={() => act(p, 'reject')} style={btn('#dc2626')}><XCircle size={16} /> Refuser</button>
                </>
            ) : (
                <span style={chip(p.status === 'validated' ? SUB.active : SUB.expired)}>{p.status === 'validated' ? `Validé${p.periodEnd ? ` → ${fmt(p.periodEnd)}` : ''}` : 'Refusé'}</span>
            )}
        </div>
    );
    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
                <h3 style={{ marginBottom: '0.8rem' }}>À vérifier ({pending.length})</h3>
                <div style={{ display: 'grid', gap: '0.7rem' }}>
                    {pending.length ? pending.map((p) => <Row key={p._id} p={p} />) : <div className="card" style={{ padding: '1.5rem', color: 'var(--glovo-gray)' }}>Aucun paiement en attente.</div>}
                </div>
            </div>
            {done.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '0.8rem' }}>Historique</h3>
                    <div style={{ display: 'grid', gap: '0.7rem' }}>{done.map((p) => <Row key={p._id} p={p} />)}</div>
                </div>
            )}
        </div>
    );
}

export default function SuperAdminPage() {
    const [tab, setTab] = useState('requests');
    const [data, setData] = useState({ restaurants: [], orphans: 0, pendingPayments: 0 });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState('');
    const [version, setVersion] = useState(0);
    const [share, setShare] = useState(null);
    const [managing, setManaging] = useState(null);
    const [filter, setFilter] = useState('approved');
    const load = () => setVersion((v) => v + 1);

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
        try {
            const res = await api(`/api/superadmin/restaurants/${r._id}`, 'PATCH', { action, note });
            if (res.share) setShare({ share: res.share, restaurant: r });
            load();
        } catch (e) { alert(e.message); } finally { setBusy(''); }
    };

    const remove = async (r) => {
        if (!confirm(`Supprimer définitivement la demande « ${r.name} » et le compte du gérant ?`)) return;
        try { await api(`/api/superadmin/restaurants/${r._id}`, 'DELETE'); load(); } catch (e) { alert(e.message); }
    };

    const manage = async (r) => {
        await api('/api/superadmin/act-as', 'POST', { restaurantId: r._id });
        window.location.href = '/admin/dashboard';
    };

    const maintenance = async (body, confirmText) => {
        if (confirmText && !confirm(confirmText)) return;
        setBusy('maintenance');
        try { alert('Terminé : ' + JSON.stringify(await api('/api/superadmin/maintenance', 'POST', body))); load(); }
        catch (e) { alert(e.message); } finally { setBusy(''); }
    };

    const requests = data.restaurants.filter((r) => r.status === 'pending');
    const others = data.restaurants.filter((r) => r.status !== 'pending' && (filter === 'all' || r.status === filter));
    const approved = data.restaurants.filter((r) => r.status === 'approved');
    const count = (s) => data.restaurants.filter((r) => r.status === s).length;

    const NAV = [
        ['requests', Inbox, 'Demandes', requests.length],
        ['restaurants', Store, 'Restaurants', 0],
        ['payments', Wallet, 'Paiements', data.pendingPayments],
        ['settings', Settings, 'Paramètres', 0],
    ];

    const RestaurantCard = ({ r }) => {
        const st = STATUS[r.status];
        const sub = r.subscription;
        return (
            <div className="card" style={{ padding: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.1rem' }}>{r.name}</strong>
                        <span style={chip(st)}>{st.label}</span>
                        {r.status === 'approved' && sub && <span style={chip(SUB[sub.state])}><Crown size={10} style={{ verticalAlign: -1 }} /> {PLAN_NAMES[r.plan]} · {SUB[sub.state].label}{sub.state !== 'expired' ? ` · ${sub.daysLeft} j` : ''}</span>}
                        {r.stats.pendingPayments > 0 && <span style={chip(SUB.grace)}>Paiement à vérifier</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--glovo-gray)' }}>{[r.cuisine, r.city, r.address].filter(Boolean).join(' · ') || '—'}</div>
                    {r.description && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{r.description}</p>}
                    <div style={{ fontSize: '0.85rem', marginTop: 8 }}><strong>{r.owner?.name}</strong> · {r.owner?.email} · {r.owner?.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--glovo-gray)', marginTop: 4 }}>
                        Demande du {fmt(r.createdAt)}{r.reviewNote ? ` · Note : ${r.reviewNote}` : ''}{r.accessSentAt ? ` · Accès envoyé le ${fmt(r.accessSentAt)}` : ''}
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
                        {r.status === 'approved' && (
                            <>
                                <button onClick={() => manage(r)} style={btn('var(--glovo-yellow)', '#1a1a1a')}><LayoutDashboard size={16} /> Gérer</button>
                                <button onClick={() => setManaging(r)} style={btn('#1a1a1a')}><Crown size={16} /> Abonnement & accès</button>
                                <button disabled={!!busy} onClick={() => act(r, 'send-access')} style={btn('#f3f4f6', '#1a1a1a')}><Send size={16} /> Envoyer l’accès</button>
                                <button disabled={!!busy} onClick={() => act(r, 'suspend')} style={btn('#4b5563')}><PauseCircle size={16} /> Suspendre</button>
                            </>
                        )}
                        {r.status !== 'approved' && (
                            <button disabled={!!busy} onClick={() => act(r, 'approve')} style={btn('#16a34a')}>
                                {r.status === 'suspended' ? <PlayCircle size={16} /> : <CheckCircle2 size={16} />} {r.status === 'suspended' ? 'Réactiver' : 'Valider'}
                            </button>
                        )}
                        {r.status === 'pending' && <button disabled={!!busy} onClick={() => act(r, 'reject')} style={btn('#dc2626')}><XCircle size={16} /> Refuser</button>}
                        {r.status !== 'approved' && <button onClick={() => remove(r)} style={btn('#f3f4f6', '#991b1b')} aria-label="Supprimer"><Trash2 size={16} /></button>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <aside className="admin-sidebar" style={{ width: '260px', backgroundColor: 'var(--glovo-dark)', color: 'white', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--glovo-yellow)', marginBottom: '3rem', padding: '0 1rem' }}>
                    ADMIN PANEL
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginTop: 4 }}>Plateforme · tous les restaurants</div>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                    {NAV.map(([key, Icon, label, badge]) => (
                        <button key={key} onClick={() => setTab(key)} style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', fontWeight: 600,
                            color: tab === key ? 'var(--glovo-dark)' : 'white', backgroundColor: tab === key ? 'var(--glovo-yellow)' : 'transparent',
                        }}>
                            <Icon size={20} /> {label}
                            {badge > 0 && <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', borderRadius: '1rem', fontSize: '0.75rem', padding: '0 0.45rem', minWidth: 20, textAlign: 'center' }}>{badge}</span>}
                        </button>
                    ))}
                </nav>
                <button onClick={() => signOut({ callbackUrl: '/' })} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', color: '#9ca3af', marginTop: 'auto' }}>
                    <LogOut size={20} /> Déconnexion
                </button>
            </aside>

            <main className="admin-main" style={{ flexGrow: 1, padding: '2rem', minWidth: 0 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                        {tab === 'requests' && 'Demandes de création de compte'}
                        {tab === 'restaurants' && 'Restaurants'}
                        {tab === 'payments' && 'Paiements des abonnements'}
                        {tab === 'settings' && 'Paramètres de la plateforme'}
                    </h1>
                </header>

                {tab !== 'settings' && tab !== 'payments' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            ['Demandes en attente', requests.length, '#f59e0b'],
                            ['Restaurants actifs', count('approved'), '#10b981'],
                            ['Plats en 3D', approved.reduce((t, r) => t + r.stats.dishes3d, 0), '#8b5cf6'],
                            ['Paiements à vérifier', data.pendingPayments, '#3b82f6'],
                        ].map(([label, value, color]) => (
                            <div key={label} className="card" style={{ padding: '1.2rem', borderTop: `4px solid ${color}` }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', fontWeight: 600 }}>{label}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {loading ? <p>Chargement…</p> : (
                    <>
                        {tab === 'requests' && (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {requests.length ? requests.map((r) => <RestaurantCard key={r._id} r={r} />) : (
                                    <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--glovo-gray)' }}>Aucune demande en attente.</div>
                                )}
                            </div>
                        )}

                        {tab === 'restaurants' && (
                            <>
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
                                    {[['approved', 'Validés'], ['suspended', 'Suspendus'], ['rejected', 'Refusés'], ['all', 'Tous']].map(([key, label]) => (
                                        <button key={key} onClick={() => setFilter(key)} style={{
                                            padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap',
                                            background: filter === key ? 'var(--glovo-dark)' : 'white', color: filter === key ? 'white' : 'var(--glovo-dark)', border: '1px solid #e5e7eb',
                                        }}>{label}{key !== 'all' ? ` (${count(key)})` : ''}</button>
                                    ))}
                                    <button onClick={() => maintenance({ action: 'sync-indexes' })} disabled={busy === 'maintenance'} title="Reconstruit les index de la base" style={{ marginLeft: 'auto', color: 'var(--glovo-gray)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                                        <Wrench size={14} /> Index
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {others.length ? others.map((r) => <RestaurantCard key={r._id} r={r} />) : (
                                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--glovo-gray)' }}>Aucun restaurant dans cette catégorie.</div>
                                    )}
                                </div>
                            </>
                        )}

                        {tab === 'payments' && <PaymentsTab onChanged={load} />}
                        {tab === 'settings' && <SettingsTab />}
                    </>
                )}
            </main>

            {share && <ShareModal share={share.share} restaurant={share.restaurant} onClose={() => setShare(null)} />}
            {managing && (
                <ManageModal
                    restaurant={managing}
                    onClose={() => setManaging(null)}
                    onSaved={(msg) => { setManaging(null); load(); if (msg) alert(msg); }}
                />
            )}
        </div>
    );
}
