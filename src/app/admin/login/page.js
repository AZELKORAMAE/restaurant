"use client";
import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--glovo-light)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'white',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                textAlign: 'center'
            }}>
                <div style={{
                    backgroundColor: 'var(--glovo-yellow)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <ShieldCheck size={32} />
                </div>

                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Espace restaurateur</h1>
                <p style={{ color: 'var(--glovo-gray)', marginBottom: '2rem' }}>Connectez-vous pour gérer votre restaurant</p>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    {error && (
                        <div style={{
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            padding: '0.8rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>Email Chef/Manager</label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--glovo-gray)' }} size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="azelkoramae@gmail.com"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #ddd',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>Mot de Passe</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--glovo-gray)' }} size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #ddd',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                    >
                        {loading ? 'Connexion...' : 'Se Connecter'}
                    </button>
                </form>
                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--glovo-gray)' }}>
                    Pas encore de compte ? <Link href="/inscription" style={{ fontWeight: 700, color: 'var(--glovo-dark)' }}>Inscrire mon restaurant</Link>
                </p>
            </div>
        </div>
    );
}
