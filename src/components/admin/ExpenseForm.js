import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ExpenseForm({ onSave, onCancel }) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description || !amount) return alert('Veuillez remplir tous les champs');
        onSave({ description, amount: parseFloat(amount) });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Nouvelle Dépense</h2>
                    <button onClick={onCancel}><X /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Facture d'électricité"
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '0.8rem',
                                border: '1px solid #ddd',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>Montant (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '0.8rem',
                                border: '1px solid #ddd',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="submit"
                            style={{
                                flex: 2,
                                backgroundColor: 'var(--glovo-yellow)',
                                padding: '1rem',
                                borderRadius: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                borderRadius: '0.8rem',
                                border: '1px solid #ddd',
                                fontWeight: 600
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
