"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChefHat, MapPin, Palette, User, Store, Send, CheckCircle2, Box } from 'lucide-react';
import LocationPicker from '@/components/restaurant/LocationPicker';
import BrandingEditor from '@/components/restaurant/BrandingEditor';
import PhonePreview from '@/components/restaurant/PhonePreview';
import { compressImage } from '@/lib/upload-client';
import { DEFAULT_THEME, COVER_PRESETS, brandVars } from '@/lib/theme';

const STEPS = [
    { key: 'you', label: 'Vous', icon: User },
    { key: 'resto', label: 'Restaurant', icon: Store },
    { key: 'place', label: 'Localisation', icon: MapPin },
    { key: 'brand', label: 'Identité', icon: Palette },
    { key: 'send', label: 'Envoi', icon: Send },
];
const ease = [0.22, 1, 0.36, 1];

export default function RegisterPage() {
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '',
        restaurantName: '', cuisine: '', city: '', description: '',
        location: null, logo: null, coverImage: COVER_PRESETS[0].url, coverPreset: COVER_PRESETS[0].url, theme: DEFAULT_THEME,
    });
    const files = useRef({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const patch = (p) => setForm((f) => ({ ...f, ...p }));
    const set = (k) => (e) => patch({ [k]: e.target.value });

    const validate = () => {
        if (step === 0) {
            if (!form.name.trim() || !form.phone.trim()) return 'Indiquez votre nom et votre téléphone.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Adresse e-mail invalide.';
            if (form.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
        }
        if (step === 1 && !form.restaurantName.trim()) return 'Indiquez le nom du restaurant.';
        return '';
    };
    const go = (delta) => {
        if (delta > 0) { const e = validate(); if (e) return setError(e); }
        setError(''); setDir(delta); setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Images stay in the browser until the request is sent (no account yet).
    const onFile = async (kind, file) => {
        const blob = await compressImage(file, { maxSize: kind === 'logo' ? 600 : 2000, quality: 0.88 });
        files.current[kind] = blob;
        return URL.createObjectURL(blob);
    };

    const submit = async () => {
        setError(''); setLoading(true);
        try {
            const fd = new FormData();
            const { logo, coverImage, ...data } = form;
            fd.append('data', JSON.stringify({ ...data, address: form.location?.address }));
            if (logo && files.current.logo) fd.append('logo', files.current.logo, 'logo.jpg');
            if (coverImage && !form.coverPreset && files.current.cover) fd.append('cover', files.current.cover, 'cover.jpg');
            const res = await fetch('/api/register', { method: 'POST', body: fd });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            setDone(true);
        } catch (err) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    const previewRestaurant = {
        name: form.restaurantName, cuisine: form.cuisine, city: form.city, description: form.description, phone: form.phone,
        logo: form.logo, coverImage: form.coverImage, theme: form.theme, location: form.location,
    };

    if (done) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'var(--paper)', ...brandVars(form.theme) }}>
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease }} className="card" style={{ background: 'white', borderRadius: 28, padding: 'clamp(1.5rem, 5vw, 3rem)', maxWidth: 520, textAlign: 'center' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 16 }}>
                        <CheckCircle2 size={64} color="#15803d" />
                    </motion.div>
                    <h1 style={{ fontSize: '2rem', margin: '1rem 0 0.6rem' }}>Demande envoyée</h1>
                    <p style={{ color: 'var(--ink-soft)', marginBottom: '1.8rem', lineHeight: 1.7 }}>
                        Votre site <strong>{form.restaurantName}</strong> est prêt et attend la validation de notre équipe.
                        Vous recevrez votre lien de connexion à <strong>{form.email}</strong> dès qu’elle sera approuvée.
                    </p>
                    <Link href="/" className="btn-ghost">Retour à l’accueil</Link>
                </motion.div>
            </main>
        );
    }

    const Current = STEPS[step];

    return (
        <main style={{ minHeight: '100vh', background: 'radial-gradient(120% 60% at 50% 0%, #fff 0%, var(--paper) 60%)', padding: '1.5rem 1rem 4rem', ...brandVars(form.theme) }}>
            <div style={{ maxWidth: step === 3 ? 1120 : 760, margin: '0 auto', transition: 'max-width .5s var(--ease)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-soft)', fontWeight: 600 }}><ArrowLeft size={18} /> Accueil</Link>
                    <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><Box size={18} color="var(--gold)" /> Menu<span style={{ color: 'var(--gold)' }}>3D</span></span>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                    <div className="eyebrow">Étape {step + 1} sur {STEPS.length}</div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', marginTop: 6 }}>
                        {['Créons votre espace', 'Parlez-nous du restaurant', 'Où vous trouver ?', 'Votre identité visuelle', 'Tout est prêt'][step]}
                    </h1>
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '2rem', maxWidth: 560, marginInline: 'auto' }}>
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const state = i < step ? 'done' : i === step ? 'current' : 'todo';
                        return (
                            <React.Fragment key={s.key}>
                                <button type="button" onClick={() => i < step && go(i - step)} title={s.label} style={{
                                    width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    background: state === 'todo' ? 'white' : 'var(--glovo-dark)', color: state === 'todo' ? '#a39a8c' : 'white',
                                    border: state === 'todo' ? '1px solid var(--line)' : 'none', cursor: i < step ? 'pointer' : 'default',
                                    boxShadow: state === 'current' ? '0 0 0 5px color-mix(in srgb, var(--brand) 45%, transparent)' : 'none', transition: 'all .3s',
                                }}>
                                    {state === 'done' ? <Check size={17} /> : <Icon size={17} />}
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div style={{ flex: 1, height: 3, borderRadius: 3, background: '#e7e0d4', overflow: 'hidden' }}>
                                        <motion.div animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.5, ease }} style={{ height: '100%', background: 'var(--glovo-dark)' }} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait" custom={dir}>
                    <motion.div
                        key={Current.key}
                        custom={dir}
                        initial={{ opacity: 0, x: dir * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: dir * -40 }}
                        transition={{ duration: 0.45, ease }}
                    >
                        {step === 0 && (
                            <div className="card" style={{ background: 'white', borderRadius: 24, padding: 'clamp(1.2rem, 4vw, 2.2rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.1rem' }}>
                                <label className="field"><span>Nom complet</span><input className="input" value={form.name} onChange={set('name')} autoComplete="name" /></label>
                                <label className="field"><span>Téléphone</span><input className="input" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
                                <label className="field"><span>E-mail (votre identifiant)</span><input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
                                <label className="field"><span>Mot de passe (8 caractères min.)</span><input className="input" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" /></label>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="card" style={{ background: 'white', borderRadius: 24, padding: 'clamp(1.2rem, 4vw, 2.2rem)', display: 'grid', gap: '1.1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.1rem' }}>
                                    <label className="field"><span>Nom du restaurant</span><input className="input" value={form.restaurantName} onChange={set('restaurantName')} /></label>
                                    <label className="field"><span>Type de cuisine</span><input className="input" placeholder="Marocaine, italienne, burgers…" value={form.cuisine} onChange={set('cuisine')} /></label>
                                    <label className="field"><span>Ville</span><input className="input" value={form.city} onChange={set('city')} /></label>
                                </div>
                                <label className="field"><span>Présentation (affichée sur votre site)</span>
                                    <textarea className="input" maxLength={600} value={form.description} onChange={set('description')} placeholder="Une cuisine de saison, des produits du marché…" />
                                </label>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="card" style={{ background: 'white', borderRadius: 24, padding: 'clamp(1rem, 3vw, 1.8rem)' }}>
                                <p style={{ color: 'var(--ink-soft)', marginBottom: '1rem', fontSize: '0.92rem' }}>
                                    Vos clients pourront lancer l’itinéraire Google Maps depuis votre site. Cherchez l’adresse, touchez la carte, ou collez le lien de votre fiche Google Maps.
                                </p>
                                <LocationPicker value={form.location} onChange={(location) => patch({ location })} />
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <div className="card" style={{ background: 'white', borderRadius: 24, padding: 'clamp(1.2rem, 3vw, 2rem)', flex: '1 1 420px', minWidth: 0 }}>
                                    <BrandingEditor value={form} onChange={patch} onFile={onFile} />
                                </div>
                                <div style={{ position: 'sticky', top: 20 }}>
                                    <PhonePreview restaurant={previewRestaurant} width={300} />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <div className="card" style={{ background: 'white', borderRadius: 24, padding: 'clamp(1.2rem, 3vw, 2rem)', flex: '1 1 360px', display: 'grid', gap: '0.9rem' }}>
                                    {[
                                        ['Gérant', `${form.name} · ${form.email} · ${form.phone}`],
                                        ['Restaurant', [form.restaurantName, form.cuisine, form.city].filter(Boolean).join(' · ')],
                                        ['Adresse', form.location?.address || 'Non renseignée (modifiable plus tard)'],
                                        ['Identité', `${form.logo ? 'Logo ajouté' : 'Sans logo'} · ${form.coverPreset ? 'Fond de la galerie' : 'Votre photo de fond'}`],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', gap: '1rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--line)' }}>
                                            <span style={{ width: 90, flexShrink: 0, color: 'var(--ink-soft)', fontWeight: 600, fontSize: '0.88rem' }}>{k}</span>
                                            <span style={{ fontWeight: 600 }}>{v}</span>
                                        </div>
                                    ))}
                                    <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', display: 'flex', gap: 8 }}>
                                        <ChefHat size={18} style={{ flexShrink: 0 }} /> Après validation, vous ajouterez vos plats, leurs photos et leurs modèles 3D. Tout reste modifiable.
                                    </p>
                                </div>
                                <PhonePreview restaurant={previewRestaurant} width={260} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {error && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fef2f2', color: '#991b1b', padding: '0.8rem 1rem', borderRadius: 14, marginTop: '1.2rem', textAlign: 'center' }}>{error}</motion.div>}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.6rem' }}>
                    {step > 0 ? <button type="button" className="btn-ghost" onClick={() => go(-1)}><ArrowLeft size={18} /> Retour</button> : <span />}
                    {step < STEPS.length - 1 ? (
                        <button type="button" className="btn-primary" onClick={() => go(1)}>
                            {step === 2 && !form.location ? 'Passer cette étape' : 'Continuer'} <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button type="button" className="btn-primary" onClick={submit} disabled={loading}>
                            {loading ? 'Envoi…' : 'Envoyer ma demande'} <Send size={17} />
                        </button>
                    )}
                </div>
                <p style={{ textAlign: 'center', marginTop: '1.6rem', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                    Déjà un compte ? <Link href="/admin/login" style={{ fontWeight: 700, color: 'var(--glovo-dark)' }}>Se connecter</Link>
                </p>
            </div>
        </main>
    );
}
