"use client";
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DishCard from '@/components/DishCard';
import DishCustomizer from '@/components/DishCustomizer';
import CartSidebar from '@/components/CartSidebar';

export default function RestaurantMenu({ slug }) {
  const [restaurant, setRestaurant] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const [initialView, setInitialView] = useState('photo');
  const [dishes, setDishes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

    async function fetchData() {
      try {
        const res = await fetch(`/api/public/restaurants/${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (!json.success) {
          setNotFound(true);
          return;
        }
        setRestaurant(json.data.restaurant);
        setDishes(json.data.dishes);
        setCollections(json.data.collections);
        document.title = `${json.data.restaurant.name} · Menu`;
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  const handleAddToCart = (customizedDish) => {
    setCart(prev => [...prev, customizedDish]);
    setIsCartOpen(true);
  };

  const filteredDishes = dishes.filter(d => {
    const matchesCollection = selectedCollection ? d.collection?._id === selectedCollection._id : true;
    const matchesSearch = searchQuery
      ? d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.collection?.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCollection && matchesSearch;
  });

  const filteredCollections = searchQuery
    ? collections.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : collections;

  const dishes3d = dishes.filter(d => d.model3d?.status === 'ready' && d.isActive !== false).length;
  const currency = restaurant?.currency || 'DH';

  if (notFound) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Menu introuvable</h1>
          <p style={{ color: 'var(--glovo-gray)', marginBottom: '2rem' }}>Ce restaurant n’existe pas ou n’est pas encore en ligne.</p>
          <a href="/scan" className="btn-primary" style={{ display: 'inline-flex' }}>Scanner un autre QR code</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: '#fdfdfd' }}>
      <Header
        restaurant={restaurant}
        tableNumber={tableNumber}
        cartCount={cart.length}
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dishes={dishes}
        collections={collections}
        onSelectDish={(dish) => {
          setInitialView('photo');
          setSelectedDish(dish);
          setSearchQuery('');
        }}
        onSelectCollection={(coll) => {
          setSelectedCollection(coll);
          setSearchQuery('');
        }}
      />

      {/* Hero Section */}
      {!selectedCollection ? (
        <section
          className="hero-section"
          style={{
            position: 'relative',
            padding: '10rem 0',
            textAlign: 'center',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("${restaurant?.coverImage || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80'}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#1a1a1a', // Fallback
            color: 'white'
          }}
        >
          <style>{`
            @media (min-width: 769px) {
              .hero-section {
                background-attachment: fixed;
              }
            }
          `}</style>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: 'clamp(3rem, 10vw, 5.5rem)',
              fontWeight: 900,
              marginBottom: '1.5rem',
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-serif)',
              animation: 'fadeInUp 1s ease-out',
              padding: '0 1rem',
              lineHeight: 1.1,
              textShadow: '0 4px 30px rgba(0,0,0,0.3)'
            }}>
              <span className="font-marker">{restaurant?.name || '\u00a0'}</span>
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 3.5vw, 1.3rem)',
              opacity: 0.95,
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              {restaurant?.description || restaurant?.cuisine || ''}
            </p>
            {tableNumber && (
              <div style={{ marginTop: '1.5rem', display: 'inline-block', background: 'var(--glovo-yellow)', color: 'var(--glovo-dark)', padding: '0.5rem 1.2rem', borderRadius: '2rem', fontWeight: 800 }}>
                Vous êtes à la table {tableNumber}
              </div>
            )}
            {dishes3d > 0 && (
              <div style={{ marginTop: '1rem', fontSize: '0.95rem', opacity: 0.95, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', padding: '0.45rem 1rem', borderRadius: '2rem', fontWeight: 700 }}>
                  ✨ {dishes3d} plat{dishes3d > 1 ? 's' : ''} à voir en 3D sur votre table
                </span>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section style={{
          position: 'relative',
          padding: '8rem 0',
          textAlign: 'center',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("${selectedCollection.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          transition: 'all 0.5s ease-in-out'
        }}>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => setSelectedCollection(null)}
              style={{
                color: 'white',
                marginBottom: '2rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                fontSize: '1rem'
              }}
            >
              ← Retour au menu complet
            </button>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem' }}>{selectedCollection.name}</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Découvrez nos délicieux {selectedCollection.name.toLowerCase()}</p>
          </div>
        </section>
      )}

      <div className="container" style={{ marginTop: '-4rem', position: 'relative', zIndex: 10, marginBottom: '8rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem', fontSize: '1.2rem', background: 'white', borderRadius: '3rem', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            Chargement de votre expérience gastronomique...
          </div>
        ) : (
          <>
            {/* Simple Collection List (One per line) */}
            {!selectedCollection && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                marginBottom: '4rem',
                padding: '0 1.5rem' // Consistent margins
              }}>
                {filteredCollections.map(c => (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCollection(c)}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '160px', // Increased height
                      borderRadius: '1.8rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      opacity: c.isActive === false ? 0.7 : 1,
                      filter: c.isActive === false ? 'grayscale(80%)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.01)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                    }}
                  >
                    <img src={c.image || restaurant?.coverImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60'} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, transparent 60%)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 2rem'
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{
                          color: 'white',
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>{c.name}</span>
                        {c.isActive === false && (
                          <div style={{
                            fontSize: '0.6rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginTop: '0.4rem',
                            fontWeight: 900,
                            display: 'inline-block'
                          }}>INDISPONIBLE</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dishes Grid */}
            {/* Dish Grid with Same Margins */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2.5rem',
              padding: '0 1.5rem' // Matching margins with collections
            }}>
              {filteredDishes.map(dish => (
                <DishCard
                  key={dish._id}
                  dish={dish}
                  currency={currency}
                  onAdd={() => { setInitialView('photo'); setSelectedDish(dish); }}
                  onView3D={() => { setInitialView('3d'); setSelectedDish(dish); }}
                />
              ))}
            </div>

            {filteredDishes.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>Aucun plat disponible pour cette sélection.</p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedDish && (
        <DishCustomizer
          key={selectedDish._id}
          dish={selectedDish}
          currency={currency}
          initialView={initialView}
          onClose={() => setSelectedDish(null)}
          onAddToCart={handleAddToCart}
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
