"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Navigation, Box, ChevronDown } from 'lucide-react';
import { normalizeTheme, mapsLinks } from '@/lib/theme';

const ease = [0.22, 1, 0.36, 1];
const rise = (delay = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease } });

/**
 * Restaurant hero: cover image (focal point + overlay), logo, name, quick actions.
 * The same component renders the public site and the live previews, so what the manager
 * sees while choosing an image is exactly what customers will get.
 */
export default function RestaurantHero({ restaurant = {}, tableNumber = null, dishes3d = 0, preview = false, onMenu }) {
    const t = normalizeTheme(restaurant.theme);
    const maps = mapsLinks(restaurant.location);
    const cover = restaurant.coverImage;
    const initials = (restaurant.name || 'R').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const place = [restaurant.cuisine, restaurant.city].filter(Boolean).join(' · ');

    return (
        <section style={{
            position: 'relative', overflow: 'hidden', containerType: 'inline-size',
            minHeight: preview ? 520 : 'min(92vh, 820px)', display: 'flex', alignItems: 'flex-end', color: 'white',
            background: '#1a1714',
        }}>
            {cover && (
                <motion.div
                    aria-hidden
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.6, ease }}
                    style={{
                        position: 'absolute', inset: 0, backgroundImage: `url("${cover}")`, backgroundSize: 'cover',
                        backgroundPosition: `${t.focalX}% ${t.focalY}%`,
                    }}
                />
            )}
            <div aria-hidden style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(180deg, rgba(12,10,8,${t.overlay * 0.55}) 0%, rgba(12,10,8,${t.overlay * 0.35}) 35%, rgba(12,10,8,${Math.min(0.95, t.overlay + 0.35)}) 100%)`,
            }} />

            <div style={{ position: 'relative', width: '100%', maxWidth: 1100, margin: '0 auto', padding: preview ? '0 1.4rem 2.4rem' : '0 1.5rem clamp(3rem, 8cqw, 6rem)', textAlign: 'center' }}>
                <motion.div {...rise(0.1)} style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.2rem' }}>
                    {restaurant.logo ? (
                        <img src={restaurant.logo} alt={`Logo ${restaurant.name || ''}`} style={{
                            width: 'clamp(84px, 22cqw, 120px)', height: 'clamp(84px, 22cqw, 120px)', objectFit: 'cover', borderRadius: '50%',
                            border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', background: 'white',
                        }} />
                    ) : (
                        <span style={{
                            width: 96, height: 96, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: t.accent, color: 'var(--brand-ink)', fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700,
                            border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                        }}>{initials}</span>
                    )}
                </motion.div>

                {place && <motion.div {...rise(0.2)} className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.7rem' }}>{place}</motion.div>}

                <motion.h1 {...rise(0.28)} style={{ fontSize: 'clamp(2.3rem, 10cqw, 4.6rem)', lineHeight: 1.04, textShadow: '0 6px 30px rgba(0,0,0,0.35)', marginBottom: '0.9rem' }}>
                    {restaurant.name || 'Votre restaurant'}
                </motion.h1>

                {restaurant.description && (
                    <motion.p {...rise(0.36)} style={{
                        maxWidth: 620, margin: '0 auto 1.4rem', fontSize: 'clamp(0.95rem, 3.6cqw, 1.15rem)', opacity: 0.9, lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{restaurant.description}</motion.p>
                )}

                <motion.div {...rise(0.44)} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {tableNumber && (
                        <span style={{ background: t.accent, color: 'var(--brand-ink)', padding: '0.45rem 1rem', borderRadius: 999, fontWeight: 800, fontSize: '0.9rem' }}>
                            Table {tableNumber}
                        </span>
                    )}
                    {dishes3d > 0 && (
                        <span className="btn-glass" style={{ padding: '0.45rem 1rem', fontSize: '0.88rem', cursor: 'default' }}>
                            <Box size={15} /> {dishes3d} plat{dishes3d > 1 ? 's' : ''} en 3D sur votre table
                        </span>
                    )}
                </motion.div>

                <motion.div {...rise(0.52)} style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button type="button" onClick={onMenu} className="btn-primary" style={{ borderRadius: 999, padding: '0.9rem 1.6rem' }}>
                        Découvrir la carte <ChevronDown size={18} />
                    </button>
                    {maps && <a className="btn-glass" href={maps.directions} target="_blank" rel="noreferrer"><Navigation size={16} /> Itinéraire</a>}
                    {restaurant.phone && <a className="btn-glass" href={`tel:${restaurant.phone}`}><Phone size={16} /> Appeler</a>}
                </motion.div>

                {restaurant.location?.address && !preview && (
                    <motion.p {...rise(0.6)} style={{ marginTop: '1.2rem', fontSize: '0.82rem', opacity: 0.78 }}>
                        <MapPin size={14} style={{ verticalAlign: -2, marginRight: 5 }} />{restaurant.location.address.split(',').slice(0, 2).join(',')}
                    </motion.p>
                )}
            </div>
        </section>
    );
}
