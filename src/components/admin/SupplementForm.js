"use client";
import React, { useState } from 'react';
import { X, Save, Image as ImageIcon, Upload } from 'lucide-react';

export default function SupplementForm({ onSave, onCancel, initialData = null }) {
    const [formData, setFormData] = useState(initialData ? {
        name: initialData.name,
        price: initialData.price,
        image: initialData.image,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
    } : {
        name: '',
        price: '',
        image: '',
        isActive: true
    });

    const [selectedStockIcon, setSelectedStockIcon] = useState(null);
    const [uploading, setUploading] = useState(false);

    const stockIcons = [
        { name: 'Frites', path: '/images/assets/supplements/frites.png' },
        { name: 'Coca-Cola', path: '/images/assets/supplements/coca-cola.png' },
        { name: 'Coca Zero', path: '/images/assets/supplements/coca-zero.png' },
        { name: 'Poms', path: '/images/assets/supplements/poms.png' },
        { name: 'Hawai', path: '/images/assets/supplements/hawai.png' },
        { name: 'S. Algérienne', path: '/images/assets/supplements/sauce-algerienne.png' },
        { name: 'S. Tomate', path: '/images/assets/supplements/sauce-tomate.png' },
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
                setSelectedStockIcon(null);
            }
        } catch (err) {
            alert("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const selectStockIcon = (path) => {
        setSelectedStockIcon(path);
        setFormData(prev => ({ ...prev, image: path }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, price: parseFloat(formData.price) });
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
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                borderRadius: 'var(--radius-lg)',
                overflowY: 'auto',
                padding: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{initialData ? 'Modifier le Supplément' : 'Ajouter un Supplément'}</h2>
                    <button onClick={onCancel}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Nom du Supplément</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="ex: Fromage Supplémentaire"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Prix (DH)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="1.50"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Icône du Supplément</label>

                        {/* Selected Icon Preview */}
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {formData.image ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                    <img src={formData.image} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Image actuelle</span>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} style={{ color: '#ef4444', fontSize: '0.8rem' }}>Supprimer</button>
                                </div>
                            ) : (
                                <div style={{ padding: '1rem', border: '2px dashed #e2e8f0', borderRadius: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                    Aucune image sélectionnée
                                </div>
                            )}
                        </div>

                        {/* Library */}
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Bibliothèque d'icônes</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                            gap: '0.8rem',
                            padding: '1rem',
                            background: '#f1f5f9',
                            borderRadius: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            {stockIcons.map(icon => (
                                <div
                                    key={icon.path}
                                    onClick={() => selectStockIcon(icon.path)}
                                    style={{
                                        padding: '0.4rem',
                                        border: `2px solid ${formData.image === icon.path ? 'var(--glovo-green)' : 'transparent'}`,
                                        borderRadius: '0.8rem',
                                        cursor: 'pointer',
                                        background: formData.image === icon.path ? 'white' : 'transparent',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <img src={icon.path} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                                    <span style={{ fontSize: '0.6rem', marginTop: '0.2rem', textAlign: 'center' }}>{icon.name}</span>
                                </div>
                            ))}
                        </div>

                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Ou uploader une image personnalisée</label>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.8rem',
                            border: '2px dashed #ddd',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            color: '#666'
                        }}>
                            <Upload size={18} />
                            {uploading ? 'Chargement...' : 'Choisir un fichier'}
                            <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="supplementIsActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="supplementIsActive" style={{ fontWeight: 600, cursor: 'pointer' }}>Supplément Actif</label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={uploading}>
                            <Save size={20} /> {initialData ? 'Enregistrer' : 'Ajouter'}
                        </button>
                        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid #ddd' }}>
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
