"use client";
import React from 'react';
import { Plus, Box, Clock } from 'lucide-react';

/** Menu card: photo, badges, name, description, price and quick add. */
export default function DishCard({ dish, onAdd, onView3D, currency = 'DH' }) {
    const inactive = dish.isActive === false;
    const has3d = dish.model3d?.status === 'ready';
    const tags = (dish.tags || []).slice(0, 2);

    return (
        <article
            className={`hover-zoom ${inactive ? '' : 'hover-lift'}`}
            onClick={() => !inactive && onAdd(dish)}
            style={{
                background: 'white', borderRadius: 22, overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)',
                display: 'flex', flexDirection: 'column', height: '100%', cursor: inactive ? 'not-allowed' : 'pointer', opacity: inactive ? 0.55 : 1,
            }}
        >
            <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', background: 'var(--sand)' }}>
                <img src={dish.image} alt={dish.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: inactive ? 'grayscale(1)' : 'none' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)' }} />
                {dish.prepTime ? (
                    <span className="glass" style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                        <Clock size={13} /> {dish.prepTime} min
                    </span>
                ) : null}
                {inactive && (
                    <span style={{ position: 'absolute', top: 12, right: 12, background: 'white', padding: '0.3rem 0.7rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 800 }}>Indisponible</span>
                )}
                {has3d && !inactive && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onView3D?.(dish); }}
                        aria-label={`Voir ${dish.name} en 3D sur ma table`}
                        style={{
                            position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 6,
                            background: 'rgba(20,18,15,0.82)', color: 'white', padding: '0.45rem 0.85rem', borderRadius: 999,
                            fontWeight: 700, fontSize: '0.78rem', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        }}
                    >
                        <Box size={15} /> Voir en 3D sur ma table
                    </button>
                )}
            </div>

            <div style={{ padding: '1.1rem 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', flexGrow: 1 }}>
                {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6 }}>
                        {tags.map((t) => <span key={t} className="eyebrow" style={{ fontSize: '0.65rem', letterSpacing: '0.12em' }}>{t}</span>)}
                    </div>
                )}
                <h3 style={{ fontSize: '1.2rem' }}>{dish.name}</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--ink-soft)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {dish.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.4rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                        {dish.price.toFixed(2)} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)' }}>{currency}</span>
                    </span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); if (!inactive) onAdd(dish); }}
                        disabled={inactive}
                        aria-label={`Ajouter ${dish.name}`}
                        style={{
                            width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: inactive ? '#ddd' : 'var(--brand)', color: 'var(--brand-ink)', boxShadow: '0 8px 18px -6px color-mix(in srgb, var(--brand) 70%, transparent)',
                            transition: 'transform .2s var(--ease)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </article>
    );
}
