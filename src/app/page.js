import Link from 'next/link';
import { redirect } from 'next/navigation';
import { QrCode, Box, ScanLine, Store, ShieldCheck, Smartphone, ChefHat, Ruler, Rotate3d, Sparkles, RefreshCw, ArrowRight, Check, ShoppingBag } from 'lucide-react';
import dbConnect from '@/lib/db';
import Restaurant from '@/models/Restaurant';
import Logo from '@/components/brand/Logo';
import s from './home.module.css';

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
    { icon: ScanLine, title: 'Ajoutez vos plats', text: 'Photos, prix, tailles, ingrédients… et un modèle 3D de chaque plat.' },
    { icon: QrCode, title: 'QR code sur chaque table', text: 'Les clients scannent, voient le menu et posent les plats sur leur table.' },
];

export default async function Home({ searchParams }) {
    // Old table QR codes pointed to "/?table=N": send them to the original restaurant's menu.
    const { table } = await searchParams;
    if (table && process.env.DEFAULT_RESTAURANT_SLUG) {
        redirect(`/r/${process.env.DEFAULT_RESTAURANT_SLUG}?table=${encodeURIComponent(table)}`);
    }
    const restaurants = await getRestaurants();

    return (
        <main className={s.page}>
            <header className={s.nav}>
                <div className={`${s.wrap} ${s.navIn}`}>
                    <Link href="/" aria-label="3D Restaurant, accueil"><Logo size={38} /></Link>
                    <nav className={s.navLinks}>
                        <a href="#fonctionnalites" className={s.hideSm}>Fonctionnalités</a>
                        <a href="#comment" className={s.hideSm}>Comment ça marche</a>
                        <Link href="/admin/login" className={s.navCta}>Espace restaurateur</Link>
                    </nav>
                </div>
            </header>

            {/* ---------- Hero ---------- */}
            <section className={s.hero}>
                <div className={s.gridBg} />
                <div className={`${s.glow} ${s.glowA}`} />
                <div className={`${s.glow} ${s.glowB}`} />
                <div className={`${s.wrap} ${s.heroGrid}`}>
                    <div>
                        <span className={s.badge}><span className={s.badgeDot}>AR</span> Réalité augmentée · taille réelle</span>
                        <h1 className={`${s.display} ${s.title}`}>
                            <span className={s.gradText}>3D</span><br />Restaurant
                        </h1>
                        <p className={s.lead}>Voyez votre plat sur votre table avant de commander.</p>
                        <p className={s.sub}>
                            Le menu digital en 3D pour les restaurants. Scannez le QR code de la table, choisissez un plat
                            et posez-le devant vous avec la caméra de votre téléphone.
                        </p>
                        <div className={s.ctas}>
                            <Link href="/scan" className={s.btnMain}><QrCode size={20} /> Scanner ma table</Link>
                            <Link href="/inscription" className={s.btnGhost}><ChefHat size={20} /> Inscrire mon restaurant</Link>
                        </div>
                        <div className={s.trust}>
                            <span><Check size={16} color="#ffc244" /> Sans application</span>
                            <span><Check size={16} color="#ffc244" /> Android & iPhone</span>
                            <span><Check size={16} color="#ffc244" /> Menu toujours à jour</span>
                        </div>
                    </div>

                    <div className={s.stage} aria-hidden>
                        <div className={s.phone}>
                            <div className={s.screen}>
                                <div className={s.notch} />
                                <div className={s.table} />
                                <span className={`${s.corner} ${s.c1}`} />
                                <span className={`${s.corner} ${s.c2}`} />
                                <span className={`${s.corner} ${s.c3}`} />
                                <span className={`${s.corner} ${s.c4}`} />
                                <div className={s.dishShadow} />
                                <div className={s.dish}>
                                    <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=70" alt="" />
                                </div>
                                <span className={s.arBtn}><Smartphone size={14} /> Voir sur ma table</span>
                            </div>
                        </div>
                        <div className={`${s.chip} ${s.chipA}`}>
                            <span className={s.chipIcon}><Ruler size={16} /></span>
                            <span><b>Taille réelle</b><small>Ø 26 cm</small></span>
                        </div>
                        <div className={`${s.chip} ${s.chipB}`}>
                            <span className={s.chipIcon}><Rotate3d size={16} /></span>
                            <span><b>Vue 360°</b><small>Tournez le plat</small></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- Fonctionnalités ---------- */}
            <section id="fonctionnalites" className={s.section}>
                <div className={s.wrap}>
                    <p className={s.eyebrow}>Fonctionnalités</p>
                    <h2 className={`${s.display} ${s.h2}`}>Un menu qu’on a envie<br />de toucher.</h2>
                    <p className={s.h2Sub}>Vos clients découvrent chaque plat comme s’il était déjà servi : en 3D, à sa vraie taille, sur leur propre table.</p>
                    <div className={s.bento}>
                        <div className={`${s.card} ${s.span4}`}>
                            <div className={s.cardGlow} />
                            <span className={s.icon}><Smartphone size={22} /></span>
                            <h3>Le plat posé sur la table</h3>
                            <p>Un appui sur « Voir sur ma table » : la caméra s’ouvre et le plat apparaît devant le client, à sa taille réelle. Il peut tourner autour et s’approcher.</p>
                        </div>
                        <div className={`${s.card} ${s.span2}`}>
                            <span className={s.icon}><Box size={22} /></span>
                            <div className={s.big}><span className={s.gradText}>360°</span></div>
                            <p style={{ marginTop: 8 }}>Chaque plat en 3D, à tourner du bout du doigt.</p>
                        </div>
                        <div className={`${s.card} ${s.span2}`}>
                            <span className={s.icon}><QrCode size={22} /></span>
                            <h3>QR code par table</h3>
                            <p>Le client scanne, le menu s’ouvre. Aucune application à installer.</p>
                        </div>
                        <div className={`${s.card} ${s.span2}`}>
                            <span className={s.icon}><ShoppingBag size={22} /></span>
                            <h3>Commande à table</h3>
                            <p>Tailles, suppléments, quantités : la commande arrive directement au restaurant.</p>
                        </div>
                        <div className={`${s.card} ${s.span2}`}>
                            <span className={s.icon}><RefreshCw size={22} /></span>
                            <h3>Toujours à jour</h3>
                            <p>Prix, plats du jour, ruptures : modifiez votre menu en un instant.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- Comment ça marche ---------- */}
            <section id="comment" className={s.section}>
                <div className={s.wrap}>
                    <p className={s.eyebrow}>Pour les restaurants</p>
                    <h2 className={`${s.display} ${s.h2}`}>Comment ça marche</h2>
                    <p className={s.h2Sub}>Quatre étapes pour passer d’un menu papier à un menu en 3D.</p>
                    <div className={s.steps}>
                        {STEPS.map(({ icon: Icon, title, text }, i) => (
                            <div key={title} className={s.step}>
                                <div className={s.stepNum}><span>0{i + 1}</span><span className={s.icon}><Icon size={20} /></span></div>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- Restaurants ---------- */}
            {restaurants.length > 0 && (
                <section className={s.section}>
                    <div className={s.wrap}>
                        <p className={s.eyebrow}>Ils sont sur 3D Restaurant</p>
                        <h2 className={`${s.display} ${s.h2}`} style={{ marginBottom: 40 }}>Les restaurants</h2>
                        <div className={s.restos}>
                            {restaurants.map((r) => (
                                <Link key={r.slug} href={`/r/${r.slug}`} className={s.resto}>
                                    <div className={s.restoCover} style={r.coverImage ? { backgroundImage: `url("${r.coverImage}")` } : undefined} />
                                    <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                        {r.logo ? <img src={r.logo} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} /> : null}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700 }}>{r.name}</div>
                                            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>{[r.cuisine, r.city].filter(Boolean).join(' · ')}</div>
                                        </div>
                                        <ArrowRight size={18} color="#ffc244" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ---------- CTA ---------- */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.cta}>
                        <div>
                            <h2 className={s.display}>Donnez envie avant même la première bouchée.</h2>
                            <p>Inscrivez votre restaurant : notre équipe valide votre compte et vous accompagne pour mettre vos plats en 3D.</p>
                        </div>
                        <Link href="/inscription" className={s.btnDark}><Sparkles size={18} /> Inscrire mon restaurant</Link>
                    </div>
                </div>
            </section>

            <footer className={s.footer}>
                <div className={`${s.wrap} ${s.footerIn}`}>
                    <Logo size={30} />
                    <div className={s.footerLinks}>
                        <Link href="/scan">Scanner ma table</Link>
                        <Link href="/inscription">Inscrire mon restaurant</Link>
                        <Link href="/admin/login">Connexion</Link>
                    </div>
                    <span>© {new Date().getFullYear()} 3D Restaurant</span>
                </div>
            </footer>
        </main>
    );
}
