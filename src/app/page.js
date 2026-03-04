"use client";
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DishCard from '@/components/DishCard';
import DishCustomizer from '@/components/DishCustomizer';
import CartSidebar from '@/components/CartSidebar';

export default function Home() {
  const [dishes, setDishes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);

  useEffect(() => {
    // Detect table from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tableNum = urlParams.get('table');
    if (tableNum) {
      localStorage.setItem('tableNumber', tableNum);
      console.log("Table detected and saved:", tableNum);
    }

    async function fetchData() {
      try {
        const [dishesRes, collsRes] = await Promise.all([
          fetch('/api/dishes').then(res => res.json()),
          fetch('/api/collections').then(res => res.json())
        ]);

        if (dishesRes.success) setDishes(dishesRes.data);
        if (collsRes.success) setCollections(collsRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddToCart = (customizedDish) => {
    setCart(prev => [...prev, customizedDish]);
    setIsCartOpen(true);
  };

  const filteredDishes = selectedCollection
    ? dishes.filter(d => d.collection?._id === selectedCollection._id)
    : dishes;

  return (
    <main style={{ backgroundColor: '#fdfdfd' }}>
      <Header cartCount={cart.length} onCartClick={() => setIsCartOpen(true)} />

      {/* Hero Section */}
      {!selectedCollection ? (
        <section style={{
          position: 'relative',
          padding: '10rem 0',
          textAlign: 'center',
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          color: 'white'
        }}>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: '4.5rem',
              fontWeight: 900,
              marginBottom: '1.5rem',
              letterSpacing: '-2px',
              fontFamily: 'var(--font-serif)',
              animation: 'fadeInUp 1s ease-out'
            }}>
              L'Art de Vivre <br /> Gourmand 🍷
            </h1>
            <p style={{ fontSize: '1.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto', fontWeight: 300 }}>
              Chaque plat raconte une histoire, chaque saveur un voyage.
            </p>
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
            {/* Collection Selector */}
            {!selectedCollection && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '5rem'
              }}>
                {collections.map(c => (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCollection(c)}
                    style={{
                      position: 'relative',
                      height: '240px',
                      borderRadius: '2rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                    }}
                  >
                    <img src={c.image || 'https://via.placeholder.com/400'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '1.5rem'
                    }}>
                      <span style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>{c.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dishes Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2.5rem'
            }}>
              {filteredDishes.map(dish => (
                <DishCard
                  key={dish._id}
                  dish={dish}
                  onAdd={() => setSelectedDish(dish)}
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
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartSidebar
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateCart={(newCart) => setCart(newCart)}
      />
    </main>
  );
}
