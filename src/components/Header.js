"use client";
import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';

export default function Header({ cartCount = 0, onCartClick, searchQuery, setSearchQuery }) {
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
                            onChange={(e) => setSearchQuery(e.target.value)}
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
