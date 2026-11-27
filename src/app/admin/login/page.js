"use client";
import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Box, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Link sent to the manager after approval: /admin/login?email=...
    useEffect(() => {
        const prefill = new URLSearchParams(window.location.search).get('email');
        // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after hydration
        if (prefill) setEmail(prefill);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (res?.ok && !res.error) {
            // Hard redirect so the proxy picks up the new session; it sends each role to its space.
            const session = await fetch('/api/auth/session').then(r => r.json()).catch(() => null);
            window.location.href = session?.user?.role === 'superadmin' ? '/superadmin' : '/admin/dashboard';
            return;
        }
        const messages = {
            pending: 'Votre demande est en cours de validation. Vous recevrez l’accès dès son approbation.',
            rejected: 'Votre demande de création de compte a été refusée.',
            suspended: 'Votre compte est suspendu. Contactez l’administrateur de la plateforme.',
        };
        setError(messages[res?.code] || 'Identifiants invalides. Veuillez réessayer.');
        setLoading(false);
    };

    return (
        <main className="login-split" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 1fr', background: 'var(--paper)' }}>
            <div className="login-visual" style={{ position: 'relative', overflow: 'hidden', color: 'white', display: 'flex', alignItems: 'flex-end', padding: '3rem' }}>
                <motion.div aria-hidden initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute', inset: 0, background: 'center/cover url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=75")' }} />
                <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,12,8,.15), rgba(15,12,8,.75))' }} />
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} style={{ position: 'relative', maxWidth: 440 }}>
                    <div className="eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}>Espace restaurateur</div>
                    <h2 style={{ fontSize: '2.4rem', margin: '0.6rem 0' }}>Votre carte, en 3D, sur chaque table.</h2>
                    <p style={{ opacity: 0.8 }}>Gérez vos plats, vos QR codes et vos commandes depuis un seul endroit.</p>
                </motion.div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.2rem' }}>
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ width: '100%', maxWidth: 400 }}>
                    <Link href="/" style={{ fontWeight: 800, fontSize: '1.15rem', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem' }}>
                        <Box size={20} color="var(--gold)" /> Menu<span style={{ color: 'var(--gold)' }}>3D</span>
                    </Link>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Bon retour parmi nous</h1>
                    <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>Connectez-vous pour gérer votre restaurant.</p>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <label className="field">
                            <span>E-mail</span>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
                                <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={{ paddingLeft: 42 }} />
                            </div>
                        </label>
                        <label className="field">
                            <span>Mot de passe</span>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
                                <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingLeft: 42 }} />
                            </div>
                        </label>
                        {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 12, fontSize: '0.9rem' }}>{error}</motion.div>}
                        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                            {loading ? 'Connexion…' : 'Se connecter'} {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                    <p style={{ marginTop: '1.8rem', fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
                        Pas encore de compte ? <Link href="/inscription" style={{ fontWeight: 700, color: 'var(--glovo-dark)' }}>Créer le site de mon restaurant</Link>
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
