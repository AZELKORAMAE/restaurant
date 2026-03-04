"use client";
import React from 'react';
import { Plus } from 'lucide-react';

export default function DishCard({ dish, onAdd }) {
    const isInactive = dish.isActive === false;

    return (
        <div
            className="card"
            onClick={() => !isInactive && onAdd(dish)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: 'var(--glovo-white)',
                cursor: isInactive ? 'not-allowed' : 'pointer',
                opacity: isInactive ? 0.6 : 1,
                position: 'relative'
            }}
        >
            <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '80%', // Slightly taller aspect ratio
                overflow: 'hidden'
            }}>
                <img
                    src={dish.image}
                    alt={dish.name}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: isInactive ? 'grayscale(100%)' : 'none'
                    }}
                    className="dish-image"
                />
                {isInactive && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3
                    }}>
                        <span style={{
                            backgroundColor: 'white',
                            color: 'black',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '2rem',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}>
                            INDISPONIBLE
                        </span>
                    </div>
                )}
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '2rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 2,
                    color: 'var(--glovo-dark)'
                }}>
                    {dish.price.toFixed(2)} DH
                </div>
            </div>

            <div style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{
                        fontSize: '1.25rem',
                        marginBottom: '0.6rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-serif)'
                    }}>
                        {dish.name}
                    </h3>
                    <p style={{
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        color: 'var(--glovo-gray)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '1.5rem'
                    }}>
                        {dish.description}
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto'
                }}>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        {/* Subtle indicator for collection or rating could go here */}
                        <span style={{ fontSize: '0.8rem', color: 'var(--glovo-green)', fontWeight: 700, backgroundColor: 'rgba(0,160,130,0.08)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem' }}>
                            {dish.collection?.name || 'Coup de cœur'}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isInactive) onAdd(dish);
                        }}
                        className="btn-primary"
                        style={{
                            padding: '0',
                            borderRadius: '50%',
                            width: '42px',
                            height: '42px',
                            justifyContent: 'center',
                            minWidth: '42px',
                            backgroundColor: isInactive ? '#ccc' : undefined,
                            cursor: isInactive ? 'not-allowed' : 'pointer'
                        }}
                        disabled={isInactive}
                    >
                        <Plus size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
}
