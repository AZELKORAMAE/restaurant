"use client";
import React, { useState } from 'react';
import { X, Save, Upload } from 'lucide-react';

export default function CollectionForm({ onSave, onCancel, initialData = null }) {
    const [formData, setFormData] = useState(initialData ? {
        name: initialData.name,
        image: initialData.image
    } : {
        name: '',
        image: ''
    });

    const [uploading, setUploading] = useState(false);

    // Reuse supplement assets for collections if needed, or provide common ones
    const stockIcons = [
        { name: 'Pizza', path: '/images/assets/supplements/sauce-tomate.png' }, // Placeholder for pizza
        { name: 'Boissons', path: '/images/assets/supplements/coca-cola.png' },
        { name: 'Accompagnements', path: '/images/assets/supplements/frites.png' },
    ];

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            });
            const json = await res.json();
            if (json.success) {
                setFormData(prev => ({ ...prev, image: json.url }));
            } else {
                alert("Erreur d'upload: " + (json.message || "Serveur non disponible"));
            }
        } catch (err) {
            alert("Erreur réseau lors de l'upload. Vérifiez votre connexion.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.image) {
            alert("Veuillez choisir une image ou une icône pour la collection");
            return;
        }
        onSave(formData);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{initialData ? 'Modifier la Collection' : 'Nouvelle Collection'}</h2>
                    <button onClick={onCancel}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Nom de la Collection</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="ex: Pizzas, Burgers..."
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Image de la Collection</label>

                        {formData.image ? (
                            <div style={{ position: 'relative', height: '180px', borderRadius: '1rem', overflow: 'hidden', marginBottom: '1rem', border: '1px solid #eee' }}>
                                <img src={formData.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)', pointerEvents: 'none' }} />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                    style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', background: 'white', borderRadius: '50%', padding: '0.4rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer' }}
                                >
                                    <X size={18} color="#ef4444" />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Library support */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {stockIcons.map(icon => (
                                        <button
                                            key={icon.path}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: icon.path }))}
                                            style={{
                                                padding: '0.5rem',
                                                border: '1px solid #eee',
                                                borderRadius: '0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                background: '#f9fafb'
                                            }}
                                        >
                                            <img src={icon.path} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                                            <span style={{ fontSize: '0.65rem' }}>{icon.name}</span>
                                        </button>
                                    ))}
                                </div>

                                <label style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '2rem',
                                    border: '2px dashed var(--glovo-green)',
                                    backgroundColor: '#f0fdf4',
                                    borderRadius: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--glovo-green)',
                                    transition: 'all 0.2s'
                                }}>
                                    <Upload size={32} />
                                    <span style={{ fontWeight: 600 }}>{uploading ? 'Upload en cours...' : 'Uploader une photo personnalisée'}</span>
                                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="collectionIsActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="collectionIsActive" style={{ fontWeight: 600, cursor: 'pointer' }}>Collection Active</label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '1.2rem' }} disabled={uploading}>
                            <Save size={20} /> {initialData ? 'Mettre à jour' : 'Créer la collection'}
                        </button>
                        <button type="button" onClick={onCancel} style={{ padding: '1.2rem', borderRadius: 'var(--radius-xl)', border: '1px solid #ddd' }}>
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
