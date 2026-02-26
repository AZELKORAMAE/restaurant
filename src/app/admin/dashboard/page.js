"use client";
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Bell, Plus, LogOut, Image as ImageIcon, X } from 'lucide-react';
import { signOut } from 'next-auth/react';

import DishForm from '@/components/admin/DishForm';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [collections, setCollections] = useState([]);
    const [supplements, setSupplements] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showDishForm, setShowDishForm] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const [editingCollection, setEditingCollection] = useState(null);
    const [editingSupplement, setEditingSupplement] = useState(null);
    const [selectedStockIcon, setSelectedStockIcon] = useState(null);

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (json.success) {
                fetchData();
                if (selectedOrder && selectedOrder._id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                }
            }
        } catch (err) {
            console.error("Error updating order status:", err);
        }
    };

    const fetchData = async () => {
        const [ordersRes, dishesRes, collsRes, suppsRes] = await Promise.all([
            fetch('/api/orders').then(res => res.json()),
            fetch('/api/dishes').then(res => res.json()),
            fetch('/api/collections').then(res => res.json()),
            fetch('/api/supplements').then(res => res.json())
        ]);

        setOrders(ordersRes.data || []);
        setDishes(dishesRes.data || []);
        setCollections(collsRes.data || []);
        setSupplements(suppsRes.data || []);
    };

    useEffect(() => {
        // Fetch data for dashboard
        fetchData();
    }, []);

    const handleFileUpload = async (file) => {
        if (!file) return null;
        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const json = await res.json();
            return json.success ? json.url : null;
        } catch (err) {
            console.error("Upload error", err);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleCreateDish = async (dishData) => {
        try {
            const url = editingDish ? `/api/dishes/${editingDish._id}` : '/api/dishes';
            const method = editingDish ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dishData),
            });
            const json = await res.json();
            if (json.success) {
                setShowDishForm(false);
                setEditingDish(null);
                fetchData();
                alert(editingDish ? 'Plat mis à jour !' : 'Plat ajouté !');
            } else {
                alert(`Erreur: ${json.error || 'Une erreur est survenue.'}`);
            }
        } catch (err) {
            console.error("Error creating/updating dish:", err);
            alert("Erreur serveur");
        }
    };

    const handleDeleteDish = async (id) => {
        if (!confirm('Supprimer ce plat ?')) return;
        try {
            const res = await fetch(`/api/dishes/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                fetchData();
            }
        } catch (err) {
            console.error("Delete error", err);
        }
    };

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const file = e.target.image.files[0];
        if (!name && !editingCollection) return;

        let imageUrl = editingCollection?.image;
        if (file) {
            imageUrl = await handleFileUpload(file);
        }

        try {
            const url = editingCollection ? `/api/collections/${editingCollection._id}` : '/api/collections';
            const method = editingCollection ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, image: imageUrl }),
            });
            const json = await res.json();
            if (json.success) {
                e.target.reset();
                setEditingCollection(null);
                fetchData();
            }
        } catch (err) {
            console.error("Error creating/updating collection:", err);
        }
    };

    const handleDeleteCollection = async (id) => {
        if (!confirm('Supprimer cette collection ? Tous les plats associés n\'auront plus de collection.')) return;
        try {
            const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchData();
        } catch (err) {
            console.error("Delete error", err);
        }
    };

    const handleCreateSupplement = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const price = e.target.price.value;
        const file = e.target.image.files[0];
        if ((!name || !price) && !editingSupplement) return;

        let imageUrl = editingSupplement?.image;
        if (file) {
            imageUrl = await handleFileUpload(file);
        } else if (selectedStockIcon) {
            imageUrl = selectedStockIcon;
        }

        try {
            const url = editingSupplement ? `/api/supplements/${editingSupplement._id}` : '/api/supplements';
            const method = editingSupplement ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    price: price ? parseFloat(price) : editingSupplement?.price,
                    image: imageUrl
                }),
            });
            const json = await res.json();
            if (json.success) {
                e.target.reset();
                setEditingSupplement(null);
                setSelectedStockIcon(null);
                fetchData();
            }
        } catch (err) {
            console.error("Error creating/updating supplement:", err);
        }
    };

    const handleDeleteSupplement = async (id) => {
        if (!confirm('Supprimer ce supplément ?')) return;
        try {
            const res = await fetch(`/api/supplements/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchData();
        } catch (err) {
            console.error("Delete error", err);
        }
    };

    const logout = () => signOut({ callbackUrl: '/' });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {(showDishForm || editingDish) && (
                <DishForm
                    onSave={handleCreateDish}
                    onCancel={() => { setShowDishForm(false); setEditingDish(null); }}
                    collections={collections}
                    availableSupplements={supplements}
                    initialData={editingDish}
                />
            )}
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                backgroundColor: 'var(--glovo-dark)',
                color: 'white',
                padding: '2rem 1rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    color: 'var(--glovo-yellow)',
                    marginBottom: '3rem',
                    padding: '0 1rem'
                }}>
                    ADMIN PANELS
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            color: activeTab === 'orders' ? 'var(--glovo-dark)' : 'white',
                            backgroundColor: activeTab === 'orders' ? 'var(--glovo-yellow)' : 'transparent',
                            fontWeight: 600
                        }}
                    >
                        <ShoppingBag size={20} />
                        Commandes
                        {orders.filter(o => o.status === 'pending').length > 0 && (
                            <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyItems: 'center', fontSize: '0.7rem' }}>
                                {orders.filter(o => o.status === 'pending').length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('dishes')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            color: activeTab === 'dishes' ? 'var(--glovo-dark)' : 'white',
                            backgroundColor: activeTab === 'dishes' ? 'var(--glovo-yellow)' : 'transparent',
                            fontWeight: 600
                        }}
                    >
                        <UtensilsCrossed size={20} />
                        Menu (Plats)
                    </button>

                    <button
                        onClick={() => setActiveTab('collections')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            color: activeTab === 'collections' ? 'var(--glovo-dark)' : 'white',
                            backgroundColor: activeTab === 'collections' ? 'var(--glovo-yellow)' : 'transparent',
                            fontWeight: 600
                        }}
                    >
                        <LayoutDashboard size={20} />
                        Collections
                    </button>

                    <button
                        onClick={() => setActiveTab('supplements')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            color: activeTab === 'supplements' ? 'var(--glovo-dark)' : 'white',
                            backgroundColor: activeTab === 'supplements' ? 'var(--glovo-yellow)' : 'transparent',
                            fontWeight: 600
                        }}
                    >
                        <Plus size={20} />
                        Suppléments
                    </button>
                </nav>

                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        color: '#9ca3af',
                        marginTop: 'auto'
                    }}
                >
                    <LogOut size={20} />
                    Déconnexion
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flexGrow: 1, padding: '2rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                        {activeTab === 'orders' && 'Gestion des Commandes'}
                        {activeTab === 'dishes' && 'Gestion du Menu'}
                        {activeTab === 'collections' && 'Gestion des Collections'}
                        {activeTab === 'supplements' && 'Gestion des Suppléments'}
                    </h1>

                    {activeTab === 'dishes' && (
                        <button className="btn-primary" onClick={() => setShowDishForm(true)}>
                            <Plus size={20} /> Ajouter un Plat
                        </button>
                    )}
                </header>

                {activeTab === 'orders' && (
                    <>
                        <div className="card" style={{ padding: '0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Id</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Client</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Total</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Statut</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map(order => (
                                        <tr key={order._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '1rem' }}>{order._id.substring(order._id.length - 6)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{order.customerInfo?.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{order.customerInfo?.phone}</div>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 700 }}>{order.totalAmount.toFixed(2)}€</td>
                                            <td style={{ padding: '1rem' }}>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                                    style={{
                                                        padding: '0.3rem 0.5rem',
                                                        borderRadius: '0.5rem',
                                                        border: '1px solid #ddd',
                                                        backgroundColor: order.status === 'pending' ? '#fef3c7' : '#dcfce7',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    <option value="pending">En attente</option>
                                                    <option value="preparing">Préparation</option>
                                                    <option value="out-for-delivery">En livraison</option>
                                                    <option value="delivered">Livré</option>
                                                    <option value="cancelled">Annulé</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    style={{ color: 'var(--glovo-green)', fontWeight: 600 }}
                                                >
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Aucune commande.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {selectedOrder && (
                            <div style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1100
                            }}>
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '1.5rem',
                                    width: '100%',
                                    maxWidth: '500px',
                                    padding: '2rem',
                                    maxHeight: '80vh',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Détails Commande #{selectedOrder._id.substring(selectedOrder._id.length - 6)}</h2>
                                        <button onClick={() => setSelectedOrder(null)}><X /></button>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Client</h3>
                                        <p>{selectedOrder.customerInfo?.name}</p>
                                        <p>{selectedOrder.customerInfo?.phone}</p>
                                        <p>{selectedOrder.customerInfo?.address}</p>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Articles</h3>
                                        {selectedOrder.items.map((item, i) => (
                                            <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span>{item.price.toFixed(2)}€</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>
                                                    {item.size ? `Taille: ${item.size.name}` : 'Taille Standard'}
                                                    {item.supplements?.length > 0 && ` • +${item.supplements.map(s => s.name).join(', ')}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900 }}>
                                        <span>Total</span>
                                        <span>{selectedOrder.totalAmount.toFixed(2)}€</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'dishes' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {dishes.map(dish => (
                            <div key={dish._id} className="card" style={{ padding: '1rem' }}>
                                <img src={dish.image} alt={dish.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }} />
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{dish.name}</h3>
                                <p style={{ color: 'var(--glovo-gray)', fontSize: '0.9rem', marginBottom: '1rem' }}>{dish.price}€</p>
                                {dish.supplements && dish.supplements.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                        {dish.supplements.map(s => (
                                            <span key={s._id} style={{
                                                fontSize: '0.7rem',
                                                padding: '0.2rem 0.5rem',
                                                background: '#f3f4f6',
                                                borderRadius: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}>
                                                {s.image && <img src={s.image} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setEditingDish(dish)}
                                        style={{ flex: 1, padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem' }}
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDish(dish._id)}
                                        style={{ flex: 1, padding: '0.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem' }}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'collections' && (
                    <div>
                        <form onSubmit={handleCreateCollection} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                            <input
                                name="name"
                                defaultValue={editingCollection?.name || ''}
                                key={editingCollection?._id || 'new'}
                                placeholder="Nom de la collection"
                                required
                                style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #ddd', flexGrow: 1 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}>
                                <ImageIcon size={18} />
                                <input name="image" type="file" accept="image/*" />
                            </div>
                            <button type="submit" className="btn-primary" disabled={uploading}>
                                {uploading ? 'Envoi...' : (editingCollection ? 'Modifier' : 'Ajouter')}
                            </button>
                            {editingCollection && (
                                <button type="button" onClick={() => setEditingCollection(null)} style={{ padding: '0.8rem', color: '#666' }}>
                                    Annuler
                                </button>
                            )}
                        </form>
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                            {collections.map(c => (
                                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {c.image && <img src={c.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.4rem' }} />}
                                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={() => setEditingCollection(c)} style={{ color: 'var(--glovo-green)' }}>Modifier</button>
                                        <button onClick={() => handleDeleteCollection(c._id)} style={{ color: '#dc2626' }}>Supprimer</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'supplements' && (
                    <div>
                        <form onSubmit={handleCreateSupplement} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            marginBottom: '3rem',
                            padding: '2rem',
                            background: 'white',
                            borderRadius: '1.5rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            border: '1px solid #f0f0f0'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Nom du supplément</label>
                                    <input
                                        name="name"
                                        defaultValue={editingSupplement?.name || ''}
                                        key={editingSupplement?._id || 'new-name'}
                                        placeholder="ex: Frites"
                                        required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Prix (€)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingSupplement?.price || ''}
                                        key={editingSupplement?._id || 'new-price'}
                                        placeholder="0.00"
                                        required
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '1rem' }}>Bibliothèque d'icônes suggérées</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '1rem',
                                    border: '1px dashed #ccc'
                                }}>
                                    {[
                                        { name: 'Frites', path: '/images/assets/supplements/frites.png' },
                                        { name: 'Coca-Cola', path: '/images/assets/supplements/coca-cola.png' },
                                        { name: 'Coca Zero', path: '/images/assets/supplements/coca-zero.png' },
                                        { name: 'Poms', path: '/images/assets/supplements/poms.png' },
                                        { name: 'Hawai', path: '/images/assets/supplements/hawai.png' },
                                        { name: 'S. Algérienne', path: '/images/assets/supplements/sauce-algerienne.png' },
                                        { name: 'S. Tomate', path: '/images/assets/supplements/sauce-tomate.png' },
                                    ].map(icon => (
                                        <div
                                            key={icon.path}
                                            onClick={() => setSelectedStockIcon(icon.path)}
                                            style={{
                                                padding: '0.5rem',
                                                border: `2px solid ${selectedStockIcon === icon.path ? 'var(--glovo-green)' : 'transparent'}`,
                                                borderRadius: '0.8rem',
                                                cursor: 'pointer',
                                                background: selectedStockIcon === icon.path ? 'white' : 'transparent',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: selectedStockIcon === icon.path ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >
                                            <img src={icon.path} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                            <span style={{ fontSize: '0.65rem', marginTop: '0.3rem', color: '#666', textAlign: 'center' }}>{icon.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Ou uploader une image personnalisée</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}>
                                        <ImageIcon size={18} />
                                        <input name="image" type="file" accept="image/*" onChange={() => setSelectedStockIcon(null)} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    <button type="submit" className="btn-primary" disabled={uploading}>
                                        {uploading ? 'Envoi...' : (editingSupplement ? 'Enregistrer' : 'Ajouter')}
                                    </button>
                                    {editingSupplement && (
                                        <button type="button" onClick={() => { setEditingSupplement(null); setSelectedStockIcon(null); }} style={{ padding: '0.8rem', color: '#666' }}>
                                            Annuler
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                            {supplements.map(s => (
                                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {s.image && <img src={s.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.4rem' }} />}
                                        <span style={{ fontWeight: 600 }}>{s.name} (+{s.price}€)</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={() => setEditingSupplement(s)} style={{ color: 'var(--glovo-green)' }}>Modifier</button>
                                        <button onClick={() => handleDeleteSupplement(s._id)} style={{ color: '#dc2626' }}>Supprimer</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
