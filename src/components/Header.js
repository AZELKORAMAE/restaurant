"use client";
import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';

export default function Header({ cartCount = 0, onCartClick }) {
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
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: 'var(--glovo-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                }}>
                    <span style={{ color: 'var(--glovo-yellow)' }}>GLOVO</span>MANGER
                </Link>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem'
                }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={20} />
                        <span style={{ display: 'none', md: 'inline' }}>Rechercher</span>
                    </button>

                    <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--glovo-dark)', fontWeight: 600 }}>
                        <User size={24} />
                        <span style={{ display: 'none', lg: 'inline' }}>Admin</span>
                    </Link>

                    <button
                        onClick={onCartClick}
                        style={{
                            backgroundColor: 'var(--glovo-yellow)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 700,
                            position: 'relative'
                        }}
                    >
                        <ShoppingCart size={20} />
                        <span>Panier</span>
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                backgroundColor: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
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
