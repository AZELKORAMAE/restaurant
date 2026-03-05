"use client";
import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';

export default function Header({ cartCount = 0, onCartClick, searchQuery, setSearchQuery, dishes = [], collections = [], onSelectDish, onSelectCollection, selectedCollection }) {
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
                                                style={{
                                                    padding: '0.7rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.8rem',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                    opacity: c.isActive === false ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <img src={c.image} style={{ width: '30px', height: '30px', borderRadius: '0.3rem', objectFit: 'cover', filter: c.isActive === false ? 'grayscale(100%)' : 'none' }} />
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name} {c.isActive === false && '(Hors ligne)'}</span>
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
                                                style={{
                                                    padding: '0.7rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.8rem',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                    opacity: d.isActive === false ? 0.6 : 1
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <img src={d.image} style={{ width: '30px', height: '30px', borderRadius: '0.3rem', objectFit: 'cover', filter: d.isActive === false ? 'grayscale(100%)' : 'none' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name} {d.isActive === false && '(Hors ligne)'}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--glovo-green)', fontWeight: 700 }}>{d.price}DH</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {showSuggestions && (
                        <div
                            onClick={() => setShowSuggestions(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 900 }}
                        />
                    )}

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

            <div style={{ overflowX: 'auto', borderTop: '1px solid #f9f9f9', marginTop: '0.5rem' }}>
                <div className="container" style={{ display: 'flex', gap: '1rem', padding: '0.8rem 1rem' }}>
                    <div
                        className={`collection-card ${!selectedCollection ? 'active' : ''}`}
                        onClick={() => onSelectCollection(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        <span>Tout</span>
                    </div>
                    {collections.map(cat => {
                        const isInactive = cat.isActive === false;
                        const isSelected = selectedCollection?._id === cat._id;
                        return (
                            <div
                                key={cat._id}
                                className={`collection-card ${isSelected ? 'active' : ''}`}
                                onClick={() => onSelectCollection(cat)}
                                style={{
                                    opacity: isInactive ? 0.5 : 1,
                                    filter: isInactive ? 'grayscale(100%)' : 'none',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                <img src={cat.image} alt={cat.name} style={{ width: '40px', height: '40px', borderRadius: '0.4rem', objectFit: 'cover' }} />
                                <span>{cat.name}</span>
                                {isInactive && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.5rem',
                                        padding: '1px 4px',
                                        borderRadius: '4px',
                                        fontWeight: 800
                                    }}>
                                        OFF
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}
