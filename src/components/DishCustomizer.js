"use client";
import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';

export default function DishCustomizer({ dish, onClose, onAddToCart }) {
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

                {/* Header with Image */}
                <div style={{ position: 'relative', height: '300px', backgroundColor: '#000', overflow: 'hidden' }}>
                    {/* Blurred background layer to fill gaps */}
                    <div style={{
                        position: 'absolute',
                        inset: '-20px',
                        backgroundImage: `url("${dish.image}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(20px) brightness(0.7)',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }} />
                    <img
                        src={dish.image}
                        alt={dish.name}
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            zIndex: 1,
                            filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))',
                            pointerEvents: 'none'
                        }}
                    />
                </div>

                <div style={{ padding: '2rem', overflowY: 'auto', flexGrow: 1 }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>{dish.name}</h2>
                    <p style={{ color: 'var(--glovo-gray)', marginBottom: '2rem', lineHeight: 1.6 }}>{dish.description}</p>

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
                                        {size.name} (+{size.price}DH)
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
                                                <div style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)' }}>+{sup.price}DH</div>
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
                            {totalPrice.toFixed(2)}DH
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
