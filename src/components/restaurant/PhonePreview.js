"use client";
import React from 'react';
import { Search, ShoppingBag, Plus, Box } from 'lucide-react';
import RestaurantHero from '@/components/restaurant/RestaurantHero';
import { brandVars } from '@/lib/theme';

const SAMPLE = [
    { name: 'Tajine de poulet', price: 85, img: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=70' },
    { name: 'Salade du chef', price: 60, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=70' },
];

/** Live preview of the restaurant's site in a phone frame (scrollable). */
export default function PhonePreview({ restaurant, width = 300 }) {
    const scale = (width - 24) / 390;
    return (
        <div style={{ width, flexShrink: 0 }}>
            <div style={{
                width, height: 780 * scale + 24, borderRadius: 44 * scale + 12, padding: 12, background: '#111',
                boxShadow: '0 30px 60px -20px rgba(0,0,0,0.45), inset 0 0 0 2px #2a2a2a', position: 'relative',
            }}>
                <div style={{ width: 390 * scale, height: 780 * scale, borderRadius: 34 * scale, overflow: 'hidden', position: 'relative', background: 'var(--paper)' }}>
                    <div className="no-scrollbar" style={{
                        width: 390, height: 780, transform: `scale(${scale})`, transformOrigin: 'top left', overflowY: 'auto',
                        ...brandVars(restaurant.theme),
                    }}>
                        <div className="glass" style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 10, padding: '2.6rem 1rem 0.7rem', borderBottom: '1px solid var(--line)' }}>
                            {restaurant.logo ? <img src={restaurant.logo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                                : <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand)' }} />}
                            <strong style={{ fontFamily: 'var(--font-serif)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{restaurant.name || 'Votre restaurant'}</strong>
                            <Search size={18} />
                            <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand)', color: 'var(--brand-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={16} /></span>
                        </div>
                        <RestaurantHero restaurant={restaurant} tableNumber="7" dishes3d={3} preview />
                        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '1rem', overflowX: 'auto' }}>
                            {['Tout', 'Entrées', 'Tajines', 'Desserts'].map((c, i) => <span key={c} className={`chip ${i === 0 ? 'active' : ''}`}>{c}</span>)}
                        </div>
                        <div style={{ display: 'grid', gap: 14, padding: '0 1rem 2rem' }}>
                            {SAMPLE.map((d) => (
                                <div key={d.name} className="card" style={{ borderRadius: 20, overflow: 'hidden', background: 'white' }}>
                                    <div style={{ position: 'relative', height: 170 }}>
                                        <img src={d.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <span style={{ position: 'absolute', left: 10, bottom: 10, background: 'rgba(20,18,15,0.85)', color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999, display: 'flex', gap: 5, alignItems: 'center' }}><Box size={13} /> Voir en 3D</span>
                                    </div>
                                    <div style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700 }}>{d.name}</div>
                                            <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{d.price} {restaurant.currency || 'DH'}</div>
                                        </div>
                                        <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: 'var(--brand-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} /></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div aria-hidden style={{ position: 'absolute', top: 12 + 10 * scale, left: '50%', transform: 'translateX(-50%)', width: 100 * scale, height: 26 * scale, borderRadius: 20, background: '#111' }} />
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 10 }}>Aperçu en direct — faites défiler l’écran</p>
        </div>
    );
}
