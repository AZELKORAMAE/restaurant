"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, X, MapPin, Phone, Navigation, ExternalLink, Box } from 'lucide-react';
import DishCard from '@/components/DishCard';
import DishCustomizer from '@/components/DishCustomizer';
import CartSidebar from '@/components/CartSidebar';
import RestaurantHero from '@/components/restaurant/RestaurantHero';
import { brandVars, mapsLinks } from '@/lib/theme';

const ease = [0.22, 1, 0.36, 1];

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay, ease }} style={{ height: '100%' }}>
      {children}
    </motion.div>
  );
}

export default function RestaurantMenu({ slug }) {
  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [initialView, setInitialView] = useState('photo');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef({});

  useEffect(() => {
    // Table detected from the QR code (?table=5), remembered per restaurant for this visit
    const key = `table:${slug}`;
    const tableNum = new URLSearchParams(window.location.search).get('table');
    try {
      if (tableNum) sessionStorage.setItem(key, tableNum);
      setTableNumber(tableNum || sessionStorage.getItem(key));
    } catch {
      setTableNumber(tableNum);
    }
    (async () => {
      try {
        const json = await (await fetch(`/api/public/restaurants/${encodeURIComponent(slug)}`)).json();
        if (!json.success) { setNotFound(true); return; }
        setRestaurant(json.data.restaurant);
        setDishes(json.data.dishes);
        setCollections(json.data.collections.filter((c) => c.isActive !== false));
        document.title = `${json.data.restaurant.name} · Menu`;
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the category being read
  useEffect(() => {
    if (!collections.length) return;
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveId(visible.target.dataset.id);
    }, { rootMargin: '-140px 0px -60% 0px' });
    Object.values(sectionRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [collections, search]);

  const q = search.trim().toLowerCase();
  const sections = useMemo(() => {
    const match = (d) => !q || d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
      || (d.ingredients || []).some((i) => i.name.toLowerCase().includes(q));
    const list = collections.map((c) => ({ ...c, dishes: dishes.filter((d) => (d.collection?._id || d.collection) === c._id && match(d)) }));
    const orphans = dishes.filter((d) => !collections.some((c) => c._id === (d.collection?._id || d.collection)) && match(d));
    if (orphans.length) list.push({ _id: 'autres', name: 'À la carte', dishes: orphans });
    return list.filter((s) => s.dishes.length);
  }, [collections, dishes, q]);

  const dishes3d = dishes.filter((d) => d.model3d?.status === 'ready' && d.isActive !== false).length;
  const currency = restaurant?.currency || 'DH';
  const cartCount = cart.reduce((n, i) => n + (i.quantity || 1), 0);
  const cartTotal = cart.reduce((n, i) => n + i.finalPrice, 0);
  const maps = mapsLinks(restaurant?.location);

  const goTo = (id) => {
    const el = sectionRefs.current[id];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
  };
  const openDish = (dish, view = 'photo') => { setInitialView(view); setSelectedDish(dish); };

  if (notFound) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'var(--paper)' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>Menu indisponible</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>Ce restaurant n’existe pas ou n’est pas en ligne pour le moment.</p>
          <Link href="/scan" className="btn-primary" style={{ display: 'inline-flex' }}>Scanner un autre QR code</Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main style={{ background: 'var(--paper)', minHeight: '100vh', ...brandVars(restaurant?.theme) }}>
      {/* Header */}
      <header className={scrolled ? 'glass' : ''} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, transition: 'background .35s, box-shadow .35s, color .35s',
        background: scrolled ? 'rgba(250,248,244,0.97)' : 'transparent',
        color: scrolled ? 'var(--glovo-dark)' : 'white', boxShadow: scrolled ? '0 1px 0 var(--line)' : 'none',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <AnimatePresence>
            {scrolled && restaurant && (
              <motion.button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, color: 'inherit' }}>
                {restaurant.logo ? <img src={restaurant.logo} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                  : <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand)' }} />}
                <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40vw' }}>{restaurant.name}</strong>
              </motion.button>
            )}
          </AnimatePresence>
          <span style={{ flex: 1 }} />
          {tableNumber && scrolled && <span style={{ background: 'var(--brand)', color: 'var(--brand-ink)', padding: '0.3rem 0.7rem', borderRadius: 999, fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Table {tableNumber}</span>}
          <button type="button" aria-label="Rechercher" onClick={() => { setSearchOpen(true); setTimeout(() => goTo(sections[0]?._id), 50); }}
            style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit', background: scrolled ? 'white' : 'rgba(255,255,255,0.16)', border: scrolled ? '1px solid var(--line)' : '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
            <Search size={18} />
          </button>
          <button type="button" aria-label="Panier" onClick={() => setIsCartOpen(true)}
            style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand)', color: 'var(--brand-ink)', boxShadow: '0 8px 18px -6px rgba(0,0,0,.35)' }}>
            <ShoppingBag size={18} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 999, background: '#1a1a1a', color: 'white', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', border: '2px solid white' }}>
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {restaurant ? (
        <RestaurantHero restaurant={restaurant} tableNumber={tableNumber} dishes3d={dishes3d} onMenu={() => goTo(sections[0]?._id)} />
      ) : (
        <div className="skeleton" style={{ height: '80vh', borderRadius: 0 }} />
      )}

      {/* Categories + search */}
      <div className="glass" style={{ position: 'sticky', top: 62, zIndex: 90, borderBottom: '1px solid var(--line)', display: sections.length || searchOpen ? 'block' : 'none' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AnimatePresence initial={false}>
            {searchOpen && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'min(260px, 60vw)', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} style={{ position: 'relative', flexShrink: 0 }}>
                <input autoFocus className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Un plat, un ingrédient…" style={{ padding: '0.55rem 2.2rem 0.55rem 0.9rem', borderRadius: 999 }} />
                <button type="button" aria-label="Fermer la recherche" onClick={() => { setSearch(''); setSearchOpen(false); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}><X size={16} /></button>
              </motion.div>
            )}
          </AnimatePresence>
          <nav className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1 }}>
            {sections.map((s) => (
              <button key={s._id} type="button" onClick={() => goTo(s._id)} className={`chip ${activeId === s._id ? 'active' : ''}`}>{s.name}</button>
            ))}
          </nav>
        </div>
      </div>

      {/* Menu */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1rem 3rem' }}>
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 360 }} />)}
          </div>
        )}
        {!loading && sections.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-soft)' }}>
            {q ? `Aucun plat ne correspond à « ${search} ».` : 'La carte arrive bientôt.'}
          </div>
        )}
        {sections.map((s) => (
          <section key={s._id} data-id={s._id} ref={(el) => { sectionRefs.current[s._id] = el; }} style={{ marginBottom: '3.5rem', scrollMarginTop: 140 }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1.4rem' }}>
                <div>
                  <div className="eyebrow">{s.dishes.length} plat{s.dishes.length > 1 ? 's' : ''}</div>
                  <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', marginTop: 4 }}>{s.name}</h2>
                  {s.description && <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>{s.description}</p>}
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--line)', marginBottom: 12 }} />
              </div>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {s.dishes.map((dish, i) => (
                <Reveal key={dish._id} delay={(i % 3) * 0.08}>
                  <DishCard dish={dish} currency={currency} onAdd={() => openDish(dish)} onView3D={() => openDish(dish, '3d')} />
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Find us */}
      {restaurant && (maps || restaurant.phone) && (
        <section style={{ background: 'white', borderTop: '1px solid var(--line)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <Reveal>
              <div className="eyebrow">Nous trouver</div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', margin: '0.4rem 0 1rem' }}>{restaurant.name}</h2>
              {restaurant.location?.address && <p style={{ display: 'flex', gap: 8, color: 'var(--ink-soft)', marginBottom: '0.6rem' }}><MapPin size={18} style={{ flexShrink: 0, marginTop: 3 }} /> {restaurant.location.address}</p>}
              {restaurant.phone && <p style={{ display: 'flex', gap: 8, color: 'var(--ink-soft)', marginBottom: '1.4rem' }}><Phone size={18} style={{ flexShrink: 0, marginTop: 3 }} /> {restaurant.phone}</p>}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {maps && <a href={maps.directions} target="_blank" rel="noreferrer" className="btn-primary"><Navigation size={17} /> Itinéraire</a>}
                {restaurant.phone && <a href={`tel:${restaurant.phone}`} className="btn-ghost"><Phone size={17} /> Appeler</a>}
                {maps && <a href={maps.open} target="_blank" rel="noreferrer" className="btn-ghost"><ExternalLink size={16} /> Google Maps</a>}
              </div>
            </Reveal>
            {maps && (
              <Reveal delay={0.1}>
                <iframe title={`Plan — ${restaurant.name}`} src={maps.embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  style={{ width: '100%', height: 340, border: 0, borderRadius: 24, boxShadow: 'var(--shadow-float)' }} />
              </Reveal>
            )}
          </div>
        </section>
      )}

      <footer style={{ textAlign: 'center', padding: '2rem 1rem 6rem', color: 'var(--ink-soft)', fontSize: '0.82rem' }}>
        © {new Date().getFullYear()} {restaurant?.name} · <Link href="/" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Box size={13} /> Menu3D</Link>
      </footer>

      {/* Floating cart */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && !selectedDish && (
          <motion.button type="button" onClick={() => setIsCartOpen(true)}
            initial={{ y: 90, x: '-50%', opacity: 0 }} animate={{ y: 0, x: '-50%', opacity: 1 }} exit={{ y: 90, x: '-50%', opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ position: 'fixed', bottom: 18, left: '50%', zIndex: 120, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0.9rem 0.85rem 1.3rem', borderRadius: 999, background: '#1a1a1a', color: 'white', boxShadow: 'var(--shadow-float)', whiteSpace: 'nowrap', fontWeight: 700 }}>
            <ShoppingBag size={18} /> Mon panier · {cartCount} article{cartCount > 1 ? 's' : ''}
            <span style={{ background: 'var(--brand)', color: 'var(--brand-ink)', borderRadius: 999, padding: '0.35rem 0.8rem' }}>{cartTotal.toFixed(2)} {currency}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {selectedDish && (
        <DishCustomizer
          key={selectedDish._id}
          dish={selectedDish}
          currency={currency}
          initialView={initialView}
          onClose={() => setSelectedDish(null)}
          onAddToCart={(item) => { setCart((prev) => [...prev, item]); }}
        />
      )}

      <CartSidebar
        restaurant={restaurant}
        tableNumber={tableNumber}
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateCart={(newCart) => setCart(newCart)}
      />
    </main>
  );
}
