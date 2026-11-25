"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChefHat, CheckCircle2, ArrowLeft } from 'lucide-react';

const input = { width: '100%', padding: '0.85rem 1rem', borderRadius: '0.8rem', border: '1px solid #e5e7eb', fontSize: '0.95rem' };
const label = { display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' };

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', restaurantName: '', cuisine: '', city: '', address: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            setDone(true);
        } catch (err) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', background: 'var(--glovo-light)', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--glovo-gray)', fontWeight: 600, marginBottom: '1.5rem' }}><ArrowLeft size={18} /> Accueil</Link>
                <div className="card" style={{ padding: 'clamp(1.2rem, 5vw, 2.5rem)' }}>
                    {done ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <CheckCircle2 size={56} color="var(--glovo-green)" style={{ marginBottom: '1rem' }} />
                            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>Demande envoyée !</h1>
                            <p style={{ color: 'var(--glovo-gray)', marginBottom: '2rem' }}>
                                Votre demande pour <strong>{form.restaurantName}</strong> est en attente de validation par notre équipe.
                                Vous pourrez vous connecter avec <strong>{form.email}</strong> dès qu’elle sera approuvée.
                            </p>
                            <Link href="/admin/login" className="btn-primary" style={{ display: 'inline-flex' }}>Aller à la connexion</Link>
                        </div>
                    ) : (
                        <form onSubmit={submit}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.5rem' }}>
                                <span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--glovo-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChefHat /></span>
                                <h1 style={{ fontSize: '1.7rem' }}>Inscrire mon restaurant</h1>
                            </div>
                            <p style={{ color: 'var(--glovo-gray)', marginBottom: '2rem' }}>Votre compte sera activé après validation par un administrateur.</p>

                            <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Le gérant</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                <div><label style={label}>Nom complet *</label><input style={input} required value={form.name} onChange={set('name')} autoComplete="name" /></div>
                                <div><label style={label}>Téléphone *</label><input style={input} required type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></div>
                                <div><label style={label}>E-mail *</label><input style={input} required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></div>
                                <div><label style={label}>Mot de passe * (8 caractères min.)</label><input style={input} required type="password" minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" /></div>
                            </div>

                            <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Le restaurant</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div><label style={label}>Nom du restaurant *</label><input style={input} required value={form.restaurantName} onChange={set('restaurantName')} /></div>
                                <div><label style={label}>Type de cuisine</label><input style={input} placeholder="Marocaine, italienne, burgers…" value={form.cuisine} onChange={set('cuisine')} /></div>
                                <div><label style={label}>Ville</label><input style={input} value={form.city} onChange={set('city')} /></div>
                                <div><label style={label}>Adresse</label><input style={input} value={form.address} onChange={set('address')} /></div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={label}>Présentation</label>
                                <textarea style={{ ...input, height: 90 }} maxLength={600} value={form.description} onChange={set('description')} placeholder="Quelques mots sur votre restaurant" />
                            </div>

                            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.8rem 1rem', borderRadius: '0.8rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                {loading ? 'Envoi…' : 'Envoyer ma demande'}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--glovo-gray)' }}>
                                Déjà un compte ? <Link href="/admin/login" style={{ fontWeight: 700, color: 'var(--glovo-dark)' }}>Se connecter</Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}
