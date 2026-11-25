import Link from 'next/link';
import { redirect } from 'next/navigation';
import { QrCode, Box, ScanLine, Store, ShieldCheck, Smartphone, ChefHat, Clock } from 'lucide-react';
import dbConnect from '@/lib/db';
import Restaurant from '@/models/Restaurant';

export const dynamic = 'force-dynamic';

async function getRestaurants() {
    try {
        await dbConnect();
        return await Restaurant.find({ status: 'approved' }).select('name slug cuisine city logo coverImage').sort({ createdAt: -1 }).limit(12).lean();
    } catch {
        return [];
    }
}

const STEPS = [
    { icon: Store, title: 'Demandez votre compte', text: 'Le gérant remplit la demande de création de son restaurant.' },
    { icon: ShieldCheck, title: 'Validation', text: 'Notre équipe vérifie et approuve le restaurant.' },
    { icon: ScanLine, title: 'Scannez vos plats', text: 'Photos, temps de préparation, ingrédients, prix, tailles… et un modèle 3D de chaque plat.' },
    { icon: QrCode, title: 'QR code sur chaque table', text: 'Les clients scannent, voient le menu et posent les plats en 3D sur leur table.' },
];

export default async function Home({ searchParams }) {
    // Old table QR codes pointed to "/?table=N": send them to the original restaurant's menu.
    const { table } = await searchParams;
    if (table && process.env.DEFAULT_RESTAURANT_SLUG) {
        redirect(`/r/${process.env.DEFAULT_RESTAURANT_SLUG}?table=${encodeURIComponent(table)}`);
    }
    const restaurants = await getRestaurants();

    return (
        <main style={{ background: 'var(--glovo-light)' }}>
            <section style={{ background: 'radial-gradient(circle at 80% 20%, #3a2a12 0%, #1a1a1a 55%)', color: 'white', padding: '1.2rem 0 5rem', overflow: 'hidden' }}>
                <div className="container">
                    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', gap: '1rem' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Box size={24} color="var(--glovo-yellow)" /> Menu<span style={{ color: 'var(--glovo-yellow)' }}>3D</span>
                        </span>
                        <Link href="/admin/login" style={{ fontWeight: 700, fontSize: '0.9rem', opacity: 0.85 }}>Espace restaurateur</Link>
                    </nav>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: 'clamp(2.4rem, 7vw, 4.2rem)', marginBottom: '1.5rem' }}>
                                Voyez votre plat <span style={{ color: 'var(--glovo-yellow)' }}>sur votre table</span> avant de commander.
                            </h1>
                            <p style={{ fontSize: '1.15rem', opacity: 0.85, marginBottom: '2rem', maxWidth: 520 }}>
                                Le menu digital en 3D et en réalité augmentée pour les restaurants. Scannez le QR code de la table, choisissez un plat, et posez-le devant vous avec la caméra de votre téléphone.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <Link href="/scan" className="btn-primary"><QrCode size={20} /> Scanner ma table</Link>
                                <Link href="/inscription" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.9rem 1.6rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700 }}>
                                    <ChefHat size={20} /> Inscrire mon restaurant
                                </Link>
                            </div>
                        </div>
                        <div aria-hidden style={{ position: 'relative', height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', width: 300, height: 120, bottom: 40, borderRadius: '50%', background: 'radial-gradient(rgba(255,194,68,0.35), transparent 70%)' }} />
                            <div style={{ width: 230, height: 360, borderRadius: 36, border: '8px solid #333', background: 'linear-gradient(#2b2b2b, #111)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=70" alt="" style={{ position: 'absolute', left: '50%', top: '52%', width: 190, height: 190, objectFit: 'cover', borderRadius: '50%', transform: 'translate(-50%,-50%) perspective(400px) rotateX(55deg)', boxShadow: '0 25px 25px rgba(0,0,0,0.6)' }} />
                                <span style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', background: 'white', color: '#111', fontWeight: 800, fontSize: 12, padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap', display: 'flex', gap: 5, alignItems: 'center' }}>
                                    <Smartphone size={13} /> Voir sur ma table
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container" style={{ padding: '4rem 1rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Comment ça marche</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
                    {STEPS.map(({ icon: Icon, title, text }, i) => (
                        <div key={title} className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.8rem' }}>
                                <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--glovo-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} /></span>
                                <span style={{ fontWeight: 900, color: 'var(--glovo-gray)' }}>0{i + 1}</span>
                            </div>
                            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{title}</h3>
                            <p style={{ color: 'var(--glovo-gray)', fontSize: '0.92rem' }}>{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {restaurants.length > 0 && (
                <section className="container" style={{ padding: '0 1rem 5rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Les restaurants</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.2rem' }}>
                        {restaurants.map((r) => (
                            <Link key={r.slug} href={`/r/${r.slug}`} className="card" style={{ display: 'block' }}>
                                <div style={{ height: 130, background: r.coverImage ? `center/cover url("${r.coverImage}")` : 'linear-gradient(135deg,#1a1a1a,#555)' }} />
                                <div style={{ padding: '1rem', display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {r.logo ? <img src={r.logo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : null}
                                    <div>
                                        <div style={{ fontWeight: 800 }}>{r.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)' }}>{[r.cuisine, r.city].filter(Boolean).join(' · ')}</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--glovo-gray)', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span><Clock size={13} style={{ verticalAlign: -2 }} /> Menu toujours à jour</span>
                <Link href="/inscription">Inscrire mon restaurant</Link>
                <Link href="/admin/login">Connexion</Link>
            </footer>
        </main>
    );
}
