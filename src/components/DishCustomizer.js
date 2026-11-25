"use client";
import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, Box, Image as ImageIcon, Clock, Flame, AlertTriangle } from 'lucide-react';
import DishViewer3D from '@/components/ar/DishViewer3D';

export default function DishCustomizer({ dish, onClose, onAddToCart, currency = 'DH', canOrder = true, initialView = 'photo' }) {
    const has3d = dish.model3d?.status === 'ready' && dish.model3d?.glb;
    const [view, setView] = useState(has3d && initialView === '3d' ? '3d' : 'photo');
    const photos = [dish.image, ...(dish.images || [])].filter(Boolean);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedSupplements, setSelectedSupplements] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [totalPrice, setTotalPrice] = useState(dish.price);

    useEffect(() => {
        let price = dish.price;
        if (selectedSize !== null && dish.sizes && dish.sizes[selectedSize]) {
            price += dish.sizes[selectedSize].price;
        }

        selectedSupplements.forEach(supId => {
            const sup = dish.supplements.find(s => s._id === supId);
            if (sup) price += sup.price;
        });

        setTotalPrice(price * quantity);
    }, [selectedSize, selectedSupplements, quantity, dish]);

    const toggleSupplement = (id) => {
        if (selectedSupplements.includes(id)) {
            setSelectedSupplements(selectedSupplements.filter(sid => sid !== id));
        } else {
            setSelectedSupplements([...selectedSupplements, id]);
        }
    };

    const handleConfirm = () => {
        const customData = {
            ...dish,
            selectedSize: selectedSize !== null ? dish.sizes[selectedSize] : null,
            selectedSupplements: dish.supplements.filter(s => selectedSupplements.includes(s._id)),
            quantity,
            finalPrice: totalPrice
        };
        onAddToCart(customData);
        onClose();
    };

    if (!dish) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: '1rem'
        }}>
            <div className="dish-customizer-modal" style={{
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '600px',
                height: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative'
            }}>
                {/* Absolute Close Button - Enhanced Touch Area and Priority */}
                <div
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Stop bubbling on touch too
                    style={{
                        position: 'absolute',
                        top: '1.2rem',
                        right: '1.2rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                        zIndex: 2000,
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <X size={26} color="#1A1A1A" strokeWidth={3} />
                </div>

                {/* Media: photo gallery or 3D / AR */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    {view === '3d' && has3d ? (
                        <DishViewer3D model3d={dish.model3d} name={dish.name} poster={dish.image} height={340} />
                    ) : (
                        <div style={{ position: 'relative', height: '300px', backgroundColor: '#000', overflow: 'hidden' }}>
                            <div style={{
                                position: 'absolute', inset: '-20px', backgroundImage: `url("${dish.image}")`,
                                backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.7)',
                                opacity: 0.5, pointerEvents: 'none'
                            }} />
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100%', overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
                                {photos.map((src, i) => (
                                    <img key={src + i} src={src} alt={dish.name} style={{
                                        flex: '0 0 100%', width: '100%', height: '100%', objectFit: 'contain', scrollSnapAlign: 'center',
                                        filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))'
                                    }} />
                                ))}
                            </div>
                            {photos.length > 1 && (
                                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', zIndex: 2, color: 'white', fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                                    ← {photos.length} photos →
                                </div>
                            )}
                        </div>
                    )}

                    {has3d && (
                        <div style={{ position: 'absolute', top: '1.2rem', left: '1.2rem', zIndex: 5, display: 'flex', background: 'white', borderRadius: '2rem', padding: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
                            {[['photo', <ImageIcon key="i" size={15} />, 'Photos'], ['3d', <Box key="b" size={15} />, '3D & AR']].map(([key, icon, label]) => (
                                <button key={key} onClick={() => setView(key)} style={{
                                    display: 'flex', alignItems: 'center', gap: 5, padding: '0.45rem 0.85rem', borderRadius: '2rem', fontWeight: 800, fontSize: '0.8rem',
                                    background: view === key ? 'var(--glovo-dark)' : 'transparent', color: view === key ? 'white' : 'var(--glovo-dark)'
                                }}>{icon}{label}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '2rem', overflowY: 'auto', flexGrow: 1 }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>{dish.name}</h2>
                    <p style={{ color: 'var(--glovo-gray)', marginBottom: '1.2rem', lineHeight: 1.6 }}>{dish.description}</p>

                    {(dish.prepTime || dish.calories || dish.tags?.length > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {dish.prepTime ? <span style={pill('#fff7ed', '#9a3412')}><Clock size={14} /> {dish.prepTime} min</span> : null}
                            {dish.calories ? <span style={pill('#fef2f2', '#991b1b')}><Flame size={14} /> {dish.calories} kcal</span> : null}
                            {(dish.tags || []).map(t => <span key={t} style={pill('#f0fdf4', '#166534')}>{t}</span>)}
                        </div>
                    )}

                    {dish.ingredients?.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.7rem' }}>Ingrédients</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {dish.ingredients.map((ing, i) => (
                                    <span key={i} style={pill('#f3f4f6', 'var(--glovo-dark)')}>
                                        {ing.name}{ing.quantity ? <em style={{ fontStyle: 'normal', color: 'var(--glovo-gray)' }}> · {ing.quantity}</em> : null}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {dish.allergens?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: '#fffbeb', color: '#92400e', padding: '0.8rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', marginBottom: '2rem' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span><strong>Allergènes :</strong> {dish.allergens.join(', ')}</span>
                        </div>
                    )}

                    {/* Sizes */}
                    {dish.sizes && dish.sizes.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Choisir la taille</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                <button
                                    onClick={() => setSelectedSize(null)}
                                    style={{
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '1rem',
                                        border: `2px solid ${selectedSize === null ? 'var(--glovo-yellow)' : '#eee'}`,
                                        background: selectedSize === null ? 'var(--accent-soft)' : 'white',
                                        fontWeight: 700
                                    }}
                                >
                                    Standard
                                </button>
                                {dish.sizes.map((size, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedSize(index)}
                                        style={{
                                            padding: '0.8rem 1.2rem',
                                            borderRadius: '1rem',
                                            border: `2px solid ${selectedSize === index ? 'var(--glovo-yellow)' : '#eee'}`,
                                            background: selectedSize === index ? 'var(--accent-soft)' : 'white',
                                            fontWeight: 700
                                        }}
                                    >
                                        {size.name} (+{size.price}{currency})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Supplements */}
                    {dish.supplements && dish.supplements.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Ajouter des suppléments</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {dish.supplements?.map(sup => {
                                    const isInactive = sup.isActive === false;
                                    return (
                                        <div
                                            key={sup._id}
                                            onClick={() => !isInactive && toggleSupplement(sup._id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                borderRadius: '1rem',
                                                border: `2px solid ${selectedSupplements.includes(sup._id) ? 'var(--glovo-green)' : '#eee'}`,
                                                background: isInactive ? '#f9f9f9' : (selectedSupplements.includes(sup._id) ? '#f0fdf4' : 'white'),
                                                cursor: isInactive ? 'not-allowed' : 'pointer',
                                                gap: '1rem',
                                                opacity: isInactive ? 0.6 : 1,
                                                filter: isInactive ? 'grayscale(100%)' : 'none'
                                            }}
                                        >
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                backgroundColor: '#f3f4f6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                border: '1px solid #eee'
                                            }}>
                                                {sup.image ? (
                                                    <img src={sup.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Icon</div>
                                                )}
                                            </div>
                                            <div style={{ flexGrow: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sup.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)' }}>+{sup.price}{currency}</div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={selectedSupplements.includes(sup._id)}
                                                readOnly
                                                disabled={isInactive}
                                                style={{ accentColor: 'var(--glovo-green)' }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="customizer-footer" style={{
                    padding: '1rem',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: '#fcfcfc',
                    paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f1f1f1', padding: '0.4rem 0.8rem', borderRadius: '2rem' }}>
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Minus size={18} />
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '15px', textAlign: 'center' }}>{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <button
                        onClick={handleConfirm}
                        className="btn-primary"
                        style={{ flexGrow: 1, justifyContent: 'center', padding: '1rem', fontSize: '0.95rem' }}
                    >
                        <ShoppingBag size={18} />
                        <span className="hide-mobile" style={{ marginLeft: '0.5rem' }}>Ajouter</span>
                        <span style={{ marginLeft: '0.5rem', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '0.5rem' }}>
                            {totalPrice.toFixed(2)}{currency}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function pill(bg, color) {
    return { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', borderRadius: '1rem', background: bg, color, fontSize: '0.8rem', fontWeight: 700 };
}
