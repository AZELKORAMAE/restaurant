import Link from 'next/link';
import { redirect } from 'next/navigation';
import { QrCode, Box, ScanLine, Store, ShieldCheck, Smartphone, ChefHat, Ruler, Sparkles, Crown, ArrowRight, MapPin } from 'lucide-react';
import dbConnect from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Reveal from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

async function getRestaurants() {
    try {
        await dbConnect();
        return await Restaurant.find({ status: 'approved' }).select('name slug cuisine city logo coverImage theme').sort({ createdAt: -1 }).limit(12).lean();
    } catch {
        return [];
    }
}

const STEPS = [
    { icon: Store, title: 'Créez votre site', text: 'Logo, photo de fond, localisation : votre site prend forme sous vos yeux.' },
    { icon: ShieldCheck, title: 'Validation', text: 'Notre équipe valide votre restaurant et vous envoie votre lien d’accès.' },
    { icon: ScanLine, title: 'Scannez vos plats', text: 'Photos, préparation, ingrédients, prix, tailles… et chaque plat en 3D.' },
    { icon: QrCode, title: 'QR code sur la table', text: 'Vos clients scannent, découvrent la carte et posent le plat sur leur table.' },
];

const FEATURES = [
    { icon: Smartphone, title: 'Réalité augmentée', text: 'Le plat apparaît sur la table du client, à sa taille réelle, avant même de commander.' },
    { icon: Ruler, title: 'Dimensions exactes', text: 'Largeur, profondeur, hauteur : affichées comme sur une fiche produit.' },
    { icon: Sparkles, title: 'Studio 3D', text: 'Mise à niveau, nettoyage de la table, qualité : un rendu digne d’une vitrine.' },
    { icon: Crown, title: 'Abonnement simple', text: 'Essai gratuit, offres claires, renouvellement en quelques clics.' },
];

const HERO_IMG = 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=900&q=75';

export default async function Home({ searchParams }) {
    // Old table QR codes pointed to "/?table=N": send them to the original restaurant's menu.
    const { table } = await searchParams;
    if (table && process.env.DEFAULT_RESTAURANT_SLUG) {
        redirect(`/r/${process.env.DEFAULT_RESTAURANT_SLUG}?table=${encodeURIComponent(table)}`);
    }
    const restaurants = await getRestaurants();

    return (
        <main style={{ background: 'var(--paper)', overflowX: 'hidden' }}>
            {/* Nav */}
            <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--line)' }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem' }}>
                    <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Box size={22} color="var(--gold)" /> Menu<span style={{ color: 'var(--gold)' }}>3D</span>
                    </Link>
                    <span style={{ flex: 1 }} />
                    {restaurants.length > 0 && <a href="#restaurants" className="hide-mobile" style={{ fontWeight: 600, fontSize: '0.92rem' }}>Restaurants</a>}
                    <Link href="/admin/login" style={{ fontWeight: 600, fontSize: '0.92rem' }}>Connexion</Link>
                    <Link href="/inscription" className="btn-primary hide-mobile" style={{ padding: '0.6rem 1.1rem', borderRadius: 999 }}>Créer mon site</Link>
                </div>
            </header>

            {/* Hero */}
            <section style={{ position: 'relative', padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 7vw, 5rem)' }}>
                <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 60% at 85% 20%, rgba(201,164,106,0.25) 0%, transparent 60%), radial-gradient(40% 50% at 10% 90%, rgba(255,194,68,0.18) 0%, transparent 60%)' }} />
                <div className="container" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                    <div>
                        <Reveal><div className="eyebrow">Menu digital · 3D · Réalité augmentée</div></Reveal>
                        <Reveal delay={0.08}>
                            <h1 style={{ fontSize: 'clamp(2.6rem, 6.5vw, 4.4rem)', margin: '1rem 0 1.2rem' }}>
                                Voyez le plat <em style={{ color: 'var(--gold)' }}>sur votre table</em> avant de commander.
                            </h1>
                        </Reveal>
                        <Reveal delay={0.16}>
                            <p style={{ fontSize: '1.15rem', color: 'var(--ink-soft)', maxWidth: 520, marginBottom: '2rem', lineHeight: 1.7 }}>
                                Le site élégant de votre restaurant, une carte en 3D à taille réelle et des QR codes sur chaque table. Simple à créer, magique pour vos clients.
                            </p>
                        </Reveal>
                        <Reveal delay={0.24}>
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                <Link href="/inscription" className="btn-primary" style={{ borderRadius: 999 }}><ChefHat size={19} /> Créer le site de mon restaurant</Link>
                                <Link href="/scan" className="btn-ghost" style={{ borderRadius: 999 }}><QrCode size={19} /> Scanner ma table</Link>
                            </div>
                        </Reveal>
                    </div>

                    <Reveal delay={0.2} y={40}>
                        <div style={{ position: 'relative', height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="float-y" style={{ width: 250, height: 470, borderRadius: 42, padding: 10, background: '#111', boxShadow: '0 40px 80px -30px rgba(40,30,10,0.55)' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: 33, overflow: 'hidden', position: 'relative', background: 'linear-gradient(#cfc6b6, #8d7f6b)' }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#d9d0c1 0%,#b8a98f 60%,#8c7b62 100%)' }} />
                                    <img src={HERO_IMG} alt="" style={{ position: 'absolute', left: '50%', top: '58%', width: 200, height: 200, objectFit: 'cover', borderRadius: '50%', transform: 'translate(-50%,-50%) perspective(500px) rotateX(58deg)', boxShadow: '0 40px 30px -10px rgba(0,0,0,0.55)' }} />
                                    <span style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: 'white', fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <Smartphone size={13} /> Voir sur ma table
                                    </span>
                                </div>
                            </div>
                            <div className="card" style={{ position: 'absolute', top: 60, right: 'max(0px, calc(50% - 230px))', background: 'white', borderRadius: 16, padding: '0.7rem 1rem', fontSize: 13, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Ruler size={16} color="var(--gold)" /> 27 × 27 × 6 cm
                            </div>
                            <div className="card" style={{ position: 'absolute', bottom: 80, left: 'max(0px, calc(50% - 240px))', background: 'white', borderRadius: 16, padding: '0.7rem 1rem', fontSize: 13, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Box size={16} color="var(--gold)" /> Tajine en 3D
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Steps */}
            <section className="container" style={{ padding: '2rem 1rem 4rem' }}>
                <Reveal><div className="eyebrow" style={{ textAlign: 'center' }}>Comment ça marche</div></Reveal>
                <Reveal delay={0.05}><h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', textAlign: 'center', margin: '0.5rem 0 2.5rem' }}>En ligne en quatre étapes</h2></Reveal>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.2rem' }}>
                    {STEPS.map(({ icon: Icon, title, text }, i) => (
                        <Reveal key={title} delay={i * 0.08}>
                            <div className="card hover-lift" style={{ background: 'white', borderRadius: 22, padding: '1.6rem', height: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                                    <span style={{ width: 46, height: 46, borderRadius: 14, background: '#f6efe2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} color="#9a7b46" /></span>
                                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#e6dccb', fontWeight: 700 }}>0{i + 1}</span>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>{title}</h3>
                                <p style={{ color: 'var(--ink-soft)', fontSize: '0.93rem', lineHeight: 1.6 }}>{text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ background: '#16130f', color: 'white', padding: 'clamp(3.5rem, 8vw, 5.5rem) 0' }}>
                <div className="container">
                    <Reveal><div className="eyebrow">Pourquoi Menu3D</div></Reveal>
                    <Reveal delay={0.05}><h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', margin: '0.5rem 0 2.5rem', maxWidth: 620 }}>Une expérience que vos clients n’oublieront pas</h2></Reveal>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.2rem' }}>
                        {FEATURES.map(({ icon: Icon, title, text }, i) => (
                            <Reveal key={title} delay={i * 0.08}>
                                <div style={{ borderRadius: 22, padding: '1.6rem', height: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <Icon size={24} color="var(--gold)" />
                                    <h3 style={{ fontSize: '1.15rem', margin: '1rem 0 0.4rem' }}>{title}</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.93rem', lineHeight: 1.6 }}>{text}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Restaurants */}
            {restaurants.length > 0 && (
                <section id="restaurants" className="container" style={{ padding: 'clamp(3.5rem, 8vw, 5rem) 1rem' }}>
                    <Reveal><div className="eyebrow">Ils sont sur Menu3D</div></Reveal>
                    <Reveal delay={0.05}><h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', margin: '0.5rem 0 2rem' }}>Les restaurants</h2></Reveal>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.3rem' }}>
                        {restaurants.map((r, i) => (
                            <Reveal key={r.slug} delay={(i % 4) * 0.06}>
                                <Link href={`/r/${r.slug}`} className="card hover-lift hover-zoom" style={{ display: 'block', background: 'white', borderRadius: 22, overflow: 'hidden' }}>
                                    <div style={{ position: 'relative', height: 150, overflow: 'hidden', background: '#2a241c' }}>
                                        {r.coverImage && <img src={r.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${r.theme?.focalX ?? 50}% ${r.theme?.focalY ?? 50}%` }} />}
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,.45))' }} />
                                        {r.logo && <img src={r.logo} alt="" style={{ position: 'absolute', left: 16, bottom: -22, width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: 'var(--shadow-soft)' }} />}
                                    </div>
                                    <div style={{ padding: '1.6rem 1.1rem 1.1rem' }}>
                                        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.15rem' }}>{r.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                            {r.city && <MapPin size={13} />} {[r.cuisine, r.city].filter(Boolean).join(' · ')}
                                        </div>
                                    </div>
                                </Link>
                            </Reveal>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="container" style={{ padding: '0 1rem 4rem' }}>
                <Reveal>
                    <div style={{ borderRadius: 32, padding: 'clamp(2rem, 6vw, 3.5rem)', background: 'linear-gradient(135deg, #f3e6cc 0%, #e9d4ab 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', marginBottom: 6 }}>Votre restaurant mérite ce menu.</h2>
                            <p style={{ color: '#5f4b2a' }}>Créez votre site en quelques minutes, essai gratuit inclus.</p>
                        </div>
                        <Link href="/inscription" className="btn-primary" style={{ borderRadius: 999, background: '#1a1a1a', color: 'white', boxShadow: 'none' }}>Commencer <ArrowRight size={18} /></Link>
                    </div>
                </Reveal>
            </section>

            <footer style={{ borderTop: '1px solid var(--line)', padding: '2rem 1rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--glovo-dark)' }}><Box size={16} color="var(--gold)" /> Menu3D</span>
                    <span style={{ display: 'flex', gap: '1.2rem' }}>
                        <Link href="/inscription">Créer mon site</Link>
                        <Link href="/scan">Scanner une table</Link>
                        <Link href="/admin/login">Connexion</Link>
                    </span>
                </div>
            </footer>
        </main>
    );
}
