"use client";
import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, Save, Upload } from 'lucide-react';

export default function DishForm({ onSave, onCancel, collections = [], availableSupplements = [], initialData = null }) {
    const [formData, setFormData] = useState(initialData ? {
        ...initialData,
        collection: initialData.collection?._id || initialData.collection || '',
        supplements: initialData.supplements?.map(s => s._id || s) || []
    } : {
        name: '',
        description: '',
        price: '',
        image: '',
        collection: '',
        sizes: [],
        supplements: [] // Array of IDs
    });

    const [newSize, setNewSize] = useState({ name: '', price: '' });
    const [uploading, setUploading] = useState(false);

    const addSize = () => {
        if (newSize.name && newSize.price) {
            setFormData({ ...formData, sizes: [...formData.sizes, { ...newSize, price: parseFloat(newSize.price) }] });
            setNewSize({ name: '', price: '' });
        }
    };

    const removeSize = (index) => {
        const updated = formData.sizes.filter((_, i) => i !== index);
        setFormData({ ...formData, sizes: updated });
    };

    const toggleSupplement = (id) => {
        setFormData(prev => {
            const exists = prev.supplements.includes(id);
            if (exists) {
                return { ...prev, supplements: prev.supplements.filter(sId => sId !== id) };
            } else {
                return { ...prev, supplements: [...prev.supplements, id] };
            }
        });
    };

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
            }
        } catch (err) {
            alert("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.collection) {
            alert("Veuillez sélectionner une collection");
            return;
        }
        if (!formData.image) {
            alert("Veuillez télécharger une image pour le plat");
            return;
        }
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
                maxWidth: '700px',
                maxHeight: '90vh',
                borderRadius: 'var(--radius-lg)',
                overflowY: 'auto',
                padding: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{initialData ? 'Modifier le Plat' : 'Ajouter un Nouveau Plat'}</h2>
                    <button onClick={onCancel}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Nom du Plat</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                maxLength={60}
                                placeholder="ex: Burger Signature"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Prix de Base (DH)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="9.99"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Décrivez les ingrédients et les saveurs..."
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd', height: '80px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Collection</label>
                            <select
                                value={formData.collection}
                                onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                            >
                                <option value="">Sélectionner une collection</option>
                                {collections.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Image du Plat</label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {formData.image ? (
                                    <div style={{ position: 'relative' }}>
                                        <img src={formData.image} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                        <X
                                            size={14}
                                            style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', cursor: 'pointer' }}
                                            onClick={() => setFormData({ ...formData, image: '' })}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ flexGrow: 1, position: 'relative' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.7rem',
                                            border: '2px dashed #ddd',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            justifyContent: 'center',
                                            fontSize: '0.9rem',
                                            color: '#666'
                                        }}>
                                            <Upload size={18} />
                                            {uploading ? 'Chargement...' : 'Choisir une image'}
                                            <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sizes Section */}
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Tailles & Options (facultatif)</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Nom (ex: XL)"
                                value={newSize.name}
                                onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                                style={{ flex: 2, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #ddd' }}
                            />
                            <input
                                type="number"
                                placeholder="Prix suppl."
                                value={newSize.price}
                                onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #ddd' }}
                            />
                            <button type="button" onClick={addSize} style={{ padding: '0.6rem', color: 'var(--glovo-green)' }}><Plus /></button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {formData.sizes.map((s, i) => (
                                <span key={i} style={{ background: '#e2e8f0', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {s.name} (+{s.price}DH) <X size={14} onClick={() => removeSize(i)} style={{ cursor: 'pointer' }} />
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Supplements Selection Section */}
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f0fdf4', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Suppléments Disponibles</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.8rem' }}>
                            {availableSupplements.map(s => (
                                <label key={s._id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem',
                                    background: formData.supplements.includes(s._id) ? 'var(--glovo-yellow)' : 'transparent',
                                    borderRadius: '0.4rem',
                                    border: '1px solid #ddd',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.supplements.includes(s._id)}
                                        onChange={() => toggleSupplement(s._id)}
                                    />
                                    {s.image && <img src={s.image} style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '0.3rem' }} />}
                                    <span>{s.name} (+{s.price}DH)</span>
                                </label>
                            ))}
                            {availableSupplements.length === 0 && (
                                <p style={{ color: '#666', fontSize: '0.85rem', gridColumn: '1/-1' }}>
                                    Aucun supplément créé. Allez dans l'onglet "Suppléments" pour en ajouter.
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                            <Save size={20} /> {initialData ? 'Enregistrer les Modifications' : 'Enregistrer le Plat'}
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
