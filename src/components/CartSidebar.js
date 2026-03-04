"use client";
import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, ChevronRight, CheckCircle } from 'lucide-react';

export default function CartSidebar({ cart = [], isOpen, onClose, onUpdateCart }) {
    const [isCheckout, setIsCheckout] = useState(false);
    const [isOrdered, setIsOrdered] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        address: '',
        phone: ''
    });
    const tableNumber = typeof window !== 'undefined' ? localStorage.getItem('tableNumber') : null;

    const total = cart.reduce((sum, item) => sum + item.finalPrice, 0);

    const removeItem = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        onUpdateCart(newCart);
    };

    const handleOrder = async () => {
        if (!tableNumber && (!customerInfo.name || !customerInfo.address || !customerInfo.phone)) {
            alert("Veuillez remplir toutes vos informations.");
            return;
        }

        if (tableNumber && !customerInfo.name && !customerInfo.phone) {
            alert("Veuillez entrer votre nom et téléphone pour que nous puissions vous identifier.");
            return;
        }

        const orderData = {
            items: cart.map(item => ({
                dish: item._id,
                name: item.name,
                quantity: item.quantity,
                size: item.selectedSize,
                supplements: item.selectedSupplements,
                price: item.finalPrice
            })),
            totalAmount: total,
            customerInfo: tableNumber ? { ...customerInfo, address: `TABLE ${tableNumber}` } : customerInfo,
            tableNumber: tableNumber
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const json = await res.json();
            if (json.success) {
                setIsOrdered(true);
                onUpdateCart([]);
            } else {
                alert("Erreur lors de la commande: " + json.error);
            }
        } catch (err) {
            alert("Une erreur est survenue lors de la commande.");
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                height: '100%',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <ShoppingBag size={24} /> Votre Panier
                    </h2>
                    <button onClick={onClose}><X size={28} /></button>
                </div>

                <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {isOrdered ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                            <CheckCircle size={80} color="var(--glovo-green)" style={{ margin: '0 auto 2rem' }} />
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem' }}>Merci pour votre commande !</h3>
                            <p style={{ color: 'var(--glovo-gray)', marginBottom: '2rem' }}>Le manager vient de recevoir votre commande. Elle sera préparée sous peu.</p>
                            <button className="btn-primary" style={{ margin: '0 auto' }} onClick={onClose}>Fermer</button>
                        </div>
                    ) : cart.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                            <ShoppingBag size={64} color="#eee" style={{ margin: '0 auto 1.5rem' }} />
                            <p style={{ color: 'var(--glovo-gray)' }}>Votre panier est vide.</p>
                        </div>
                    ) : !isCheckout ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {cart.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f9f9f9' }}>
                                    <img src={item.image} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '1rem' }} />
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{item.quantity}x {item.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--glovo-gray)', marginBottom: '0.4rem' }}>
                                            {item.selectedSize ? `Taille: ${item.selectedSize.name}` : 'Taille Standard'}
                                            {item.selectedSupplements.length > 0 && ` • +${item.selectedSupplements.map(s => s.name).join(', ')}`}
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--glovo-dark)' }}>{item.finalPrice.toFixed(2)}€</div>
                                    </div>
                                    <button onClick={() => removeItem(i)} style={{ alignSelf: 'center', color: '#ef4444' }}><Trash2 size={20} /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                {tableNumber ? `Commande pour la Table ${tableNumber}` : 'Informations de Livraison'}
                            </h3>
                            {tableNumber && (
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#dcfce7',
                                    color: 'var(--glovo-green)',
                                    borderRadius: '1rem',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    textAlign: 'center'
                                }}>
                                    ✨ Commande sur place validée
                                </div>
                            )}
                            <input
                                placeholder="Votre Nom"
                                value={customerInfo.name}
                                onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid #ddd' }}
                            />
                            <input
                                placeholder="Numéro de Téléphone"
                                value={customerInfo.phone}
                                onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid #ddd' }}
                            />
                            {!tableNumber && (
                                <textarea
                                    placeholder="Adresse de Livraison"
                                    value={customerInfo.address}
                                    onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid #ddd', height: '100px' }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {!isOrdered && cart.length > 0 && (
                    <div style={{ padding: '2rem', borderTop: '1px solid #eee', background: '#fdfdfd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1.1rem', color: 'var(--glovo-gray)' }}>Total</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{total.toFixed(2)}€</span>
                        </div>

                        {!isCheckout ? (
                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1.2rem' }} onClick={() => setIsCheckout(true)}>
                                Valider la commande <ChevronRight size={20} />
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button style={{ flex: 1, padding: '1.2rem', borderRadius: 'var(--radius-xl)', border: '1px solid #ddd' }} onClick={() => setIsCheckout(false)}>
                                    Retour
                                </button>
                                <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleOrder}>
                                    Confirmer et Payer
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
