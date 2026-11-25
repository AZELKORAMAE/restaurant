"use client";
import React, { useState } from 'react';
import { X, Plus, Save, Upload, Clock, Camera } from 'lucide-react';
import Model3DPanel from '@/components/admin/Model3DPanel';
import { uploadFile, compressImage } from '@/lib/upload-client';

const ALLERGENS = ['Gluten', 'Lait', 'Œufs', 'Arachides', 'Fruits à coque', 'Soja', 'Poisson', 'Crustacés', 'Céleri', 'Moutarde', 'Sésame', 'Sulfites'];
const TAGS = ['Signature', 'Nouveau', 'Végétarien', 'Vegan', 'Épicé', 'Sans gluten', 'Halal', 'Fait maison'];

const input = { width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd' };
const label = { display: 'block', marginBottom: '0.4rem', fontWeight: 600 };
const section = (bg) => ({ marginBottom: '2rem', padding: '1.5rem', background: bg, borderRadius: 'var(--radius-lg)' });
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' };

function Chip({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick} style={{
            padding: '0.35rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600,
            border: '1px solid ' + (active ? 'var(--glovo-dark)' : '#ddd'),
            background: active ? 'var(--glovo-dark)' : 'white', color: active ? 'white' : 'var(--glovo-dark)',
        }}>{children}</button>
    );
}

export default function DishForm({ onSave, onCancel, collections = [], availableSupplements = [], initialData = null, aiEnabled = false, currency = 'DH' }) {
    const [formData, setFormData] = useState(() => ({
        name: '',
        description: '',
        price: '',
        image: '',
        images: [],
        collection: '',
        sizes: [],
        supplements: [],
        prepTime: '',
        calories: '',
        ingredients: [],
        allergens: [],
        tags: [],
        model3d: { status: 'none', captureImages: [], realDiameterCm: 26 },
        isActive: true,
        ...(initialData || {}),
        ...(initialData ? {
            collection: initialData.collection?._id || initialData.collection || '',
            supplements: initialData.supplements?.map(s => s._id || s) || [],
            prepTime: initialData.prepTime ?? '',
            calories: initialData.calories ?? '',
            images: initialData.images || [],
            ingredients: initialData.ingredients || [],
            allergens: initialData.allergens || [],
            tags: initialData.tags || [],
            model3d: { status: 'none', captureImages: [], realDiameterCm: 26, ...(initialData.model3d || {}) },
        } : {}),
    }));

    const [newSize, setNewSize] = useState({ name: '', price: '' });
    const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '' });
    const [uploading, setUploading] = useState('');
    const [saving, setSaving] = useState(false);

    const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));
    const toggleIn = (key, value) => setFormData(prev => ({
        ...prev,
        [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }));

    const addSize = () => {
        if (newSize.name && newSize.price !== '') {
            update({ sizes: [...formData.sizes, { name: newSize.name, price: parseFloat(newSize.price) }] });
            setNewSize({ name: '', price: '' });
        }
    };

    const addIngredient = () => {
        if (newIngredient.name.trim()) {
            update({ ingredients: [...formData.ingredients, { ...newIngredient, name: newIngredient.name.trim() }] });
            setNewIngredient({ name: '', quantity: '' });
        }
    };

    const uploadPhotos = async (e, target) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(target);
        try {
            const urls = [];
            for (const f of files) urls.push(await uploadFile(await compressImage(f, { maxSize: 1800 }), { filename: f.name.replace(/\.\w+$/, '.jpg') }));
            if (target === 'main') update({ image: urls[0], images: [...formData.images, ...urls.slice(1)] });
            else update({ images: [...formData.images, ...urls].slice(0, 12) });
        } catch (err) {
            alert("Erreur lors de l'upload : " + err.message);
        } finally {
            setUploading('');
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.collection) return alert("Veuillez sélectionner une collection");
        if (!formData.image) return alert("Veuillez ajouter une photo du plat");
        setSaving(true);
        try {
            await onSave({ ...formData, price: parseFloat(formData.price) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '760px', maxHeight: '92vh', borderRadius: 'var(--radius-lg)', overflowY: 'auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{initialData ? 'Modifier le Plat' : 'Ajouter un Nouveau Plat'}</h2>
                    <button onClick={onCancel} aria-label="Fermer"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={grid2}>
                        <div>
                            <label style={label}>Nom du Plat</label>
                            <input type="text" required value={formData.name} maxLength={60} placeholder="ex: Burger Signature"
                                onChange={(e) => update({ name: e.target.value })} style={input} />
                        </div>
                        <div>
                            <label style={label}>Prix de Base ({currency})</label>
                            <input type="number" step="0.01" min="0" required value={formData.price} placeholder="59.00"
                                onChange={(e) => update({ price: e.target.value })} style={input} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={label}>Description</label>
                        <textarea required value={formData.description} placeholder="Décrivez le plat, sa cuisson, ses saveurs..."
                            onChange={(e) => update({ description: e.target.value })} style={{ ...input, height: '80px' }} />
                    </div>

                    <div style={grid2}>
                        <div>
                            <label style={label}>Collection</label>
                            <select value={formData.collection} required onChange={(e) => update({ collection: e.target.value })} style={input}>
                                <option value="">Sélectionner une collection</option>
                                {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <div>
                                <label style={label}><Clock size={14} style={{ verticalAlign: -2 }} /> Préparation (min)</label>
                                <input type="number" min="0" max="600" value={formData.prepTime} placeholder="15"
                                    onChange={(e) => update({ prepTime: e.target.value })} style={input} />
                            </div>
                            <div>
                                <label style={label}>Calories</label>
                                <input type="number" min="0" value={formData.calories} placeholder="kcal"
                                    onChange={(e) => update({ calories: e.target.value })} style={input} />
                            </div>
                        </div>
                    </div>

                    {/* Photos */}
                    <div style={section('#fff7ed')}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><Camera size={18} /> Photos du plat</h3>
                        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {formData.image ? (
                                <div style={{ position: 'relative' }}>
                                    <img src={formData.image} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: '0.7rem', border: '3px solid var(--glovo-yellow)' }} />
                                    <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, background: 'var(--glovo-yellow)', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>Principale</span>
                                    <X size={16} onClick={() => update({ image: formData.images[0] || '', images: formData.images.slice(1) })}
                                        style={{ position: 'absolute', top: -6, right: -6, background: 'red', color: 'white', borderRadius: '50%', cursor: 'pointer' }} />
                                </div>
                            ) : (
                                <label style={{ width: 96, height: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: '2px dashed #ddd', borderRadius: '0.7rem', cursor: 'pointer', fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
                                    <Upload size={18} /> {uploading === 'main' ? '...' : 'Photo principale'}
                                    <input type="file" hidden accept="image/*" onChange={(e) => uploadPhotos(e, 'main')} disabled={!!uploading} />
                                </label>
                            )}
                            {formData.images.map((url, i) => (
                                <div key={url} style={{ position: 'relative' }}>
                                    <img src={url} alt="" onClick={() => update({ image: url, images: [formData.image, ...formData.images.filter(u => u !== url)].filter(Boolean) })}
                                        title="Définir comme photo principale" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '0.6rem', cursor: 'pointer' }} />
                                    <X size={14} onClick={() => update({ images: formData.images.filter((_, j) => j !== i) })}
                                        style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', cursor: 'pointer' }} />
                                </div>
                            ))}
                            {formData.image && formData.images.length < 12 && (
                                <label style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ddd', borderRadius: '0.6rem', cursor: 'pointer', color: '#666' }}>
                                    {uploading === 'gallery' ? '...' : <Plus size={20} />}
                                    <input type="file" hidden multiple accept="image/*" onChange={(e) => uploadPhotos(e, 'gallery')} disabled={!!uploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 3D */}
                    <Model3DPanel
                        dishId={initialData?._id}
                        model3d={formData.model3d}
                        photo={formData.image}
                        aiEnabled={aiEnabled}
                        onChange={(model3d) => setFormData(prev => ({ ...prev, model3d }))}
                    />

                    {/* Ingredients */}
                    <div style={section('#f0f9ff')}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Ingrédients</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input type="text" placeholder="Ingrédient (ex: Bœuf haché)" value={newIngredient.name}
                                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                                style={{ flex: 2, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #ddd', minWidth: 0 }} />
                            <input type="text" placeholder="Qté (180 g)" value={newIngredient.quantity}
                                onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #ddd', minWidth: 0 }} />
                            <button type="button" onClick={addIngredient} style={{ padding: '0.6rem', color: 'var(--glovo-green)' }} aria-label="Ajouter"><Plus /></button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.2rem' }}>
                            {formData.ingredients.map((ing, i) => (
                                <span key={i} style={{ background: '#e0f2fe', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {ing.name}{ing.quantity ? ` · ${ing.quantity}` : ''}
                                    <X size={14} onClick={() => update({ ingredients: formData.ingredients.filter((_, j) => j !== i) })} style={{ cursor: 'pointer' }} />
                                </span>
                            ))}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Allergènes</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
                            {ALLERGENS.map(a => <Chip key={a} active={formData.allergens.includes(a)} onClick={() => toggleIn('allergens', a)}>{a}</Chip>)}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Étiquettes</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {TAGS.map(t => <Chip key={t} active={formData.tags.includes(t)} onClick={() => toggleIn('tags', t)}>{t}</Chip>)}
                        </div>
                    </div>

                    {/* Sizes */}
                    <div style={section('#f8fafc')}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Tailles & Options (facultatif)</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input type="text" placeholder="Nom (ex: XL)" value={newSize.name}
                                onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                                style={{ flex: 2, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #ddd', minWidth: 0 }} />
                            <input type="number" placeholder="Prix suppl." value={newSize.price}
                                onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #ddd', minWidth: 0 }} />
                            <button type="button" onClick={addSize} style={{ padding: '0.6rem', color: 'var(--glovo-green)' }} aria-label="Ajouter"><Plus /></button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {formData.sizes.map((s, i) => (
                                <span key={i} style={{ background: '#e2e8f0', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {s.name} (+{s.price}{currency}) <X size={14} onClick={() => update({ sizes: formData.sizes.filter((_, j) => j !== i) })} style={{ cursor: 'pointer' }} />
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Supplements */}
                    <div style={section('#f0fdf4')}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Suppléments Disponibles</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.8rem' }}>
                            {availableSupplements.map(s => (
                                <label key={s._id} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                                    background: formData.supplements.includes(s._id) ? 'var(--glovo-yellow)' : 'transparent',
                                    borderRadius: '0.4rem', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.9rem'
                                }}>
                                    <input type="checkbox" checked={formData.supplements.includes(s._id)} onChange={() => toggleIn('supplements', s._id)} />
                                    {s.image && <img src={s.image} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '0.3rem' }} />}
                                    <span>{s.name} (+{s.price}{currency})</span>
                                </label>
                            ))}
                            {availableSupplements.length === 0 && (
                                <p style={{ color: '#666', fontSize: '0.85rem', gridColumn: '1/-1' }}>
                                    Aucun supplément créé. Allez dans l’onglet « Suppléments » pour en ajouter.
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="isActive" checked={formData.isActive}
                            onChange={(e) => update({ isActive: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
                        <label htmlFor="isActive" style={{ fontWeight: 600, cursor: 'pointer' }}>Plat Actif (visible par les clients)</label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', position: 'sticky', bottom: 0, background: 'white', paddingTop: '0.5rem' }}>
                        <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                            <Save size={20} /> {saving ? 'Enregistrement…' : initialData ? 'Enregistrer' : 'Enregistrer le Plat'}
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
