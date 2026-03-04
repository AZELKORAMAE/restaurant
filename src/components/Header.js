"use client";
import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';

export default function Header({ cartCount = 0, onCartClick, searchQuery, setSearchQuery, dishes = [], collections = [], onSelectDish, onSelectCollection }) {
    const [showSuggestions, setShowSuggestions] = React.useState(false);

    const suggestions = searchQuery.length > 0 ? {
        dishes: dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5),
        collections: collections.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    } : { dishes: [], collections: [] };

    const hasSuggestions = suggestions.dishes.length > 0 || suggestions.collections.length > 0;
    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: 'var(--glovo-white)',
            borderBottom: '1px solid #eee',
            padding: '1rem 0'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Link href="/" style={{
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    color: 'var(--glovo-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    flexShrink: 0
                }}>
                    <span style={{ color: 'var(--glovo-yellow)' }}>GLOVO</span><span className="hide-mobile">MANGER</span>
                    {typeof window !== 'undefined' && localStorage.getItem('tableNumber') && (
                        <span style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.7rem',
                            backgroundColor: 'var(--glovo-yellow)',
                            color: 'var(--glovo-dark)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '1rem',
                            whiteSpace: 'nowrap'
                        }}>
                            T{localStorage.getItem('tableNumber')}
                        </span>
                    )}
                </Link>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    flexGrow: 1,
                    justifyContent: 'flex-end'
                }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        maxWidth: '300px'
                    }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', color: 'var(--glovo-gray)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '2rem',
                                border: '1px solid #eee',
                                backgroundColor: '#f9f9f9',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />

                        {showSuggestions && hasSuggestions && (
                            <div style={{
                                position: 'absolute',
                                top: '110%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                borderRadius: '1rem',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                border: '1px solid #eee',
                                overflow: 'hidden',
                                zIndex: 1000
                            }}>
                                {suggestions.collections.length > 0 && (
                                    <div style={{ padding: '0.5rem 0' }}>
                                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--glovo-gray)', textTransform: 'uppercase' }}>Catégories</div>
                                        {suggestions.collections.map(c => (
                                            <div
                                                key={c._id}
                                                onClick={() => {
                                                    onSelectCollection(c);
                                                    setSearchQuery('');
                                                    setShowSuggestions(false);
                                                }}
                                                style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <img src={c.image} style={{ width: '30px', height: '30px', borderRadius: '0.3rem', objectFit: 'cover' }} />
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {suggestions.dishes.length > 0 && (
                                    <div style={{ padding: '0.5rem 0', borderTop: suggestions.collections.length > 0 ? '1px solid #eee' : 'none' }}>
                                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--glovo-gray)', textTransform: 'uppercase' }}>Produits</div>
                                        {suggestions.dishes.map(d => (
                                            <div
                                                key={d._id}
                                                onClick={() => {
                                                    onSelectDish(d);
                                                    setSearchQuery('');
                                                    setShowSuggestions(false);
                                                }}
                                                style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <img src={d.image} style={{ width: '30px', height: '30px', borderRadius: '0.3rem', objectFit: 'cover' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--glovo-green)', fontWeight: 700 }}>{d.price}DH</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {showSuggestions && (
                            <div
                                onClick={() => setShowSuggestions(false)}
                                style={{ position: 'fixed', inset: 0, zIndex: 900 }}
                            />
                        )}
                    </div>

                    <button
                        onClick={onCartClick}
                        style={{
                            backgroundColor: 'var(--glovo-yellow)',
                            padding: '0.6rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            position: 'relative',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ShoppingCart size={22} />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
