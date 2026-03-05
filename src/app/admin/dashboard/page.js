"use client";
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Bell, Plus, LogOut, Image as ImageIcon, X, Table2, Printer, Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import QRCode from 'react-qr-code';
import { signOut } from 'next-auth/react';

import DishForm from '@/components/admin/DishForm';
import CollectionForm from '@/components/admin/CollectionForm';
import SupplementForm from '@/components/admin/SupplementForm';
import ExpenseForm from '@/components/admin/ExpenseForm';
import { useRef } from 'react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [collections, setCollections] = useState([]);
    const [supplements, setSupplements] = useState([]);
    const [tables, setTables] = useState([]);
    const [showTableForm, setShowTableForm] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showDishForm, setShowDishForm] = useState(false);
    const [showCollectionForm, setShowCollectionForm] = useState(false);
    const [showSupplementForm, setShowSupplementForm] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const [editingCollection, setEditingCollection] = useState(null);
    const [editingSupplement, setEditingSupplement] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [financeFilter, setFinanceFilter] = useState('month'); // day, week, month, year, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStockIcon, setSelectedStockIcon] = useState(null);
    const audioRef = useRef(null);
    const prevOrdersCountRef = useRef(0);

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
        const [ordersRes, dishesRes, collsRes, suppsRes, tablesRes, expensesRes] = await Promise.all([
            fetch('/api/orders').then(res => res.json()),
            fetch('/api/dishes').then(res => res.json()),
            fetch('/api/collections').then(res => res.json()),
            fetch('/api/supplements').then(res => res.json()),
            fetch('/api/tables').then(res => res.json()),
            fetch('/api/expenses').then(res => res.json())
        ]);

        setOrders(ordersRes.data || []);
        setDishes(dishesRes.data || []);
        setCollections(collsRes.data || []);
        setSupplements(suppsRes.data || []);
        setTables(tablesRes.data || []);
        setExpenses(expensesRes.data || []);
    };

    useEffect(() => {
        // Fetch data for dashboard
        fetchData();

        // Polling for new orders every 10 seconds
        const interval = setInterval(() => {
            fetchData();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    };

    useEffect(() => {
        const pendingOrders = orders.filter(o => o.status === 'pending');
        if (pendingOrders.length > prevOrdersCountRef.current) {
            playNotificationSound();
        }
        prevOrdersCountRef.current = pendingOrders.length;
    }, [orders]);

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
                alert(`Erreur: ${json.error || 'Erreur lors de la sauvegarde du plat'}`);
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

    const handleCreateCollection = async (collectionData) => {
        if (!collectionData.image) {
            alert("Erreur: L'image est obligatoire pour une collection.");
            return;
        }
        try {
            const url = editingCollection ? `/api/collections/${editingCollection._id}` : '/api/collections';
            const method = editingCollection ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(collectionData),
            });
            const json = await res.json();
            if (json.success) {
                setShowCollectionForm(false);
                setEditingCollection(null);
                fetchData();
                alert(editingCollection ? 'Collection mise à jour !' : 'Collection ajoutée !');
            } else {
                alert(`Erreur: ${json.error || 'Erreur lors de la sauvegarde de la collection'}`);
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

    const handleCreateSupplement = async (supplementData) => {
        try {
            const url = editingSupplement ? `/api/supplements/${editingSupplement._id}` : '/api/supplements';
            const method = editingSupplement ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplementData),
            });
            const json = await res.json();
            if (json.success) {
                setShowSupplementForm(false);
                setEditingSupplement(null);
                fetchData();
                alert(editingSupplement ? 'Supplément mis à jour !' : 'Supplément ajouté !');
            } else {
                alert(`Erreur: ${json.error || 'Erreur lors de la sauvegarde du supplément'}`);
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

    const handleCreateTable = async (tableData) => {
        try {
            const url = editingTable ? `/api/tables/${editingTable._id}` : '/api/tables';
            const method = editingTable ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tableData),
            });
            const json = await res.json();
            if (json.success) {
                setShowTableForm(false);
                setEditingTable(null);
                fetchData();
                alert(editingTable ? 'Table mise à jour !' : 'Table ajoutée !');
            } else {
                alert(`Erreur: ${json.error || 'Erreur lors de la sauvegarde de la table'}`);
            }
        } catch (err) {
            console.error("Error creating/updating table:", err);
        }
    };

    const handleDeleteTable = async (id) => {
        if (!confirm('Supprimer cette table ?')) return;
        try {
            const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchData();
        } catch (err) {
            console.error("Delete error", err);
        }
    };

    const handlePrintQR = (tableNumber) => {
        const printWindow = window.open('', '_blank');
        const qrSvg = document.getElementById(`qr-table-${tableNumber}`).innerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Table ${tableNumber}</title>
                    <style>
                        body { 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0; 
                            font-family: sans-serif; 
                        }
                        .container { text-align: center; border: 2px solid #000; padding: 40px; border-radius: 20px; }
                        h1 { font-size: 48px; margin-bottom: 20px; }
                        p { font-size: 24px; color: #666; }
                        svg { width: 300px; height: 300px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>TABLE ${tableNumber}</h1>
                        <div>${qrSvg}</div>
                        <p>Scannez pour commander</p>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleCreateExpense = async (expenseData) => {
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData),
            });
            const json = await res.json();
            if (json.success) {
                setShowExpenseForm(false);
                fetchData();
            } else {
                alert(`Erreur: ${json.error}`);
            }
        } catch (err) {
            console.error("Error creating expense:", err);
        }
    };

    const handleToggleDish = async (dish) => {
        const originalDishes = [...dishes];
        // Optimistic update
        setDishes(dishes.map(d => d._id === dish._id ? { ...d, isActive: !d.isActive } : d));

        try {
            const res = await fetch(`/api/dishes/${dish._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...dish, isActive: !dish.isActive })
            });
            if (!res.ok) {
                setDishes(originalDishes);
                alert("Erreur lors de la mise à jour");
            }
        } catch (err) {
            setDishes(originalDishes);
            console.error("Toggle failed", err);
        }
    };

    const handleToggleCollection = async (collection) => {
        const originalCollections = [...collections];
        // Optimistic update
        setCollections(collections.map(c => c._id === collection._id ? { ...c, isActive: !c.isActive } : c));

        try {
            const res = await fetch(`/api/collections/${collection._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...collection, isActive: !collection.isActive })
            });
            if (!res.ok) {
                setCollections(originalCollections);
                alert("Erreur lors de la mise à jour");
            }
        } catch (err) {
            setCollections(originalCollections);
            console.error("Toggle failed", err);
        }
    };

    const handleToggleSupplement = async (sup) => {
        const originalSupplements = [...supplements];
        // Optimistic update
        setSupplements(supplements.map(s => s._id === sup._id ? { ...s, isActive: !s.isActive } : s));

        try {
            const res = await fetch(`/api/supplements/${sup._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...sup, isActive: !sup.isActive })
            });
            if (!res.ok) {
                setSupplements(originalSupplements);
                alert("Erreur lors de la mise à jour");
            }
        } catch (err) {
            setSupplements(originalSupplements);
            console.error("Toggle failed", err);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!confirm('Supprimer cette dépense ?')) return;
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                fetchData();
            } else {
                alert("Erreur: " + (json.error || "Impossible de supprimer"));
            }
        } catch (err) {
            console.error("Delete error", err);
            alert("Erreur réseau ou serveur");
        }
    };

    const logout = () => signOut({ callbackUrl: '/' });

    const getFinanceData = () => {
        const now = new Date();
        const start = new Date();

        if (financeFilter === 'day') start.setHours(0, 0, 0, 0);
        else if (financeFilter === 'week') start.setDate(now.getDate() - 7);
        else if (financeFilter === 'month') start.setMonth(now.getMonth() - 1);
        else if (financeFilter === 'year') start.setFullYear(now.getFullYear() - 1);
        else if (financeFilter === 'custom' && startDate) {
            start.setTime(new Date(startDate).getTime());
        }

        const end = new Date();
        if (financeFilter === 'custom' && endDate) {
            end.setTime(new Date(endDate).getTime());
            end.setHours(23, 59, 59, 999);
        }

        const filteredOrders = orders.filter(o => {
            const date = new Date(o.createdAt);
            return date >= start && date <= end && o.status !== 'cancelled';
        });
        const filteredExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date >= start && date <= end;
        });

        const revenue = filteredOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        const expenseTotal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

        return { revenue, expenseTotal, profit: revenue - expenseTotal, ordersCount: filteredOrders.length, expenses: filteredExpenses };
    };

    const financeData = getFinanceData();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Audio for notifications */}
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />

            {(showDishForm || editingDish) && (
                <DishForm
                    onSave={handleCreateDish}
                    onCancel={() => { setShowDishForm(false); setEditingDish(null); }}
                    collections={collections}
                    availableSupplements={supplements}
                    initialData={editingDish}
                />
            )}
            {(showCollectionForm || editingCollection) && (
                <CollectionForm
                    onSave={handleCreateCollection}
                    onCancel={() => { setShowCollectionForm(false); setEditingCollection(null); }}
                    initialData={editingCollection}
                />
            )}
            {(showSupplementForm || editingSupplement) && (
                <SupplementForm
                    onSave={handleCreateSupplement}
                    onCancel={() => { setShowSupplementForm(false); setEditingSupplement(null); }}
                    initialData={editingSupplement}
                />
            )
            }
            {
                showExpenseForm && (
                    <ExpenseForm
                        onSave={handleCreateExpense}
                        onCancel={() => setShowExpenseForm(false)}
                    />
                )
            }
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

                    <button
                        onClick={() => setActiveTab('tables')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            color: activeTab === 'tables' ? 'var(--glovo-dark)' : 'white',
                            backgroundColor: activeTab === 'tables' ? 'var(--glovo-yellow)' : 'transparent',
                            fontWeight: 600
                        }}
                    >
                        <Table2 size={20} />
                        Tables & QR
                    </button>

                    <button
                        onClick={() => setActiveTab('finance')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            color: activeTab === 'finance' ? 'var(--glovo-dark)' : 'white',
                            backgroundColor: activeTab === 'finance' ? 'var(--glovo-yellow)' : 'transparent',
                            fontWeight: 600
                        }}
                    >
                        <Wallet size={20} />
                        Finance
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
                        {activeTab === 'tables' && 'Gestion des Tables'}
                    </h1>

                    {activeTab === 'dishes' && (
                        <button className="btn-primary" onClick={() => setShowDishForm(true)}>
                            <Plus size={20} /> Nouveau Plat
                        </button>
                    )}
                    {activeTab === 'collections' && (
                        <button className="btn-primary" onClick={() => setShowCollectionForm(true)}>
                            <Plus size={20} /> Nouvelle Collection
                        </button>
                    )}
                    {activeTab === 'supplements' && (
                        <button className="btn-primary" onClick={() => setShowSupplementForm(true)}>
                            <Plus size={20} /> Nouveau Supplément
                        </button>
                    )}
                    {activeTab === 'tables' && (
                        <button className="btn-primary" onClick={() => setShowTableForm(true)}>
                            <Plus size={20} /> Nouvelle Table
                        </button>
                    )}
                    {activeTab === 'finance' && (
                        <button className="btn-primary" onClick={() => setShowExpenseForm(true)}>
                            <Plus size={20} /> Ajouter une Dépense
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
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Client / Table</th>
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{order.customerInfo?.name || 'Client Express'}</div>
                                                    {order.tableNumber && (
                                                        <span style={{
                                                            backgroundColor: 'var(--glovo-yellow)',
                                                            color: 'var(--glovo-dark)',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 900
                                                        }}>
                                                            TABLE {order.tableNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{order.customerInfo?.phone}</div>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 700 }}>{order.totalAmount.toFixed(2)}DH</td>
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
                                        {selectedOrder.customerInfo?.name ? (
                                            <>
                                                <p>{selectedOrder.customerInfo?.name}</p>
                                                <p>{selectedOrder.customerInfo?.phone}</p>
                                                <p>{selectedOrder.customerInfo?.address}</p>
                                            </>
                                        ) : (
                                            <p>Commande sur place</p>
                                        )}
                                        {selectedOrder.tableNumber && (
                                            <div style={{
                                                marginTop: '1rem',
                                                padding: '1rem',
                                                backgroundColor: 'var(--glovo-yellow)',
                                                borderRadius: '1rem',
                                                textAlign: 'center',
                                                fontWeight: 900,
                                                fontSize: '1.2rem',
                                                color: 'var(--glovo-dark)'
                                            }}>
                                                📍 TABLE : {selectedOrder.tableNumber}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Articles</h3>
                                        {selectedOrder.items.map((item, i) => (
                                            <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span>{item.price.toFixed(2)}DH</span>
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
                                        <span>{selectedOrder.totalAmount.toFixed(2)}DH</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'dishes' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>

                            {dishes.map(dish => (
                                <div key={dish._id} className="card" style={{ padding: '1rem' }}>
                                    <img src={dish.image} alt={dish.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{dish.name}</h3>
                                    <p style={{ color: 'var(--glovo-gray)', fontSize: '0.9rem', marginBottom: '1rem' }}>{dish.price}DH</p>
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
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <button
                                            onClick={() => handleToggleDish(dish)}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                background: dish.isActive === false ? 'var(--glovo-green)' : '#f3f4f6',
                                                color: dish.isActive === false ? 'white' : 'inherit',
                                                borderRadius: '0.5rem',
                                                fontWeight: 700,
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {dish.isActive === false ? 'Activer' : 'Désactiver'}
                                        </button>
                                    </div>
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
                    </div>
                )}

                {activeTab === 'supplements' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* The "Nouveau Supplément" button is already rendered in the header */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                            {supplements.map(s => (
                                <div key={s._id} className="card" style={{ padding: '1rem', opacity: s.isActive === false ? 0.6 : 1, position: 'relative' }}>
                                    <div style={{ position: 'relative', textAlign: 'center', marginBottom: '1rem' }}>
                                        <img src={s.image} alt={s.name} style={{ height: '60px', objectFit: 'contain' }} />
                                        {s.isActive === false && (
                                            <div style={{ position: 'absolute', top: '0', right: '0', background: '#ef4444', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '0.3rem', fontSize: '0.6rem', fontWeight: 700 }}>
                                                OFF
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{s.name}</div>
                                        <div style={{ color: 'var(--glovo-green)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem' }}>{s.price}DH</div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <button
                                                onClick={() => handleToggleSupplement(s)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.4rem',
                                                    borderRadius: '0.4rem',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    background: s.isActive === false ? 'var(--glovo-green)' : '#f3f4f6',
                                                    color: s.isActive === false ? 'white' : 'inherit'
                                                }}
                                            >
                                                {s.isActive === false ? 'Activer' : 'Désactiver'}
                                            </button>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button onClick={() => setEditingSupplement(s)} style={{ flex: 1, padding: '0.4rem', background: '#f3f4f6', borderRadius: '0.4rem', fontSize: '0.7rem' }}>Modif</button>
                                                <button onClick={() => handleDeleteSupplement(s._id)} style={{ flex: 1, padding: '0.4rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.4rem', fontSize: '0.7rem' }}>Suppr</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'collections' && (
                    <div>
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                            {collections.map(c => (
                                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {c.image && <img src={c.image} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.4rem' }} />}
                                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <button
                                            onClick={() => handleToggleCollection(c)}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: c.isActive === false ? 'var(--glovo-green)' : '#f3f4f6',
                                                color: c.isActive === false ? 'white' : 'inherit'
                                            }}
                                        >
                                            {c.isActive === false ? 'Activer' : 'Désactiver'}
                                        </button>
                                        <button onClick={() => setEditingCollection(c)} style={{ color: 'var(--glovo-green)' }}>Modifier</button>
                                        <button onClick={() => handleDeleteCollection(c._id)} style={{ color: '#dc2626' }}>Supprimer</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Filters */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['day', 'week', 'month', 'year', 'custom'].map(period => (
                                    <button
                                        key={period}
                                        onClick={() => setFinanceFilter(period)}
                                        style={{
                                            padding: '0.5rem 1.2rem',
                                            borderRadius: '0.8rem',
                                            textTransform: 'capitalize',
                                            fontWeight: 600,
                                            backgroundColor: financeFilter === period ? 'var(--glovo-yellow)' : '#f3f4f6',
                                            color: financeFilter === period ? 'var(--glovo-dark)' : '#6b7280',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : period === 'year' ? 'Année' : 'Personnalisé'}
                                    </button>
                                ))}
                            </div>

                            {financeFilter === 'custom' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                    <span>au</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Stats Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>Revenus</span>
                                    <TrendingUp style={{ color: '#10b981' }} size={20} />
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{financeData.revenue.toFixed(2)}DH</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>{financeData.ordersCount} commandes</div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>Dépenses</span>
                                    <TrendingDown style={{ color: '#ef4444' }} size={20} />
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{financeData.expenseTotal.toFixed(2)}DH</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>{financeData.expenses.length} dépenses</div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--glovo-yellow)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>C.A Net (Profit)</span>
                                    <Wallet style={{ color: 'var(--glovo-yellow)' }} size={20} />
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{financeData.profit.toFixed(2)}DH</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem', color: financeData.profit >= 0 ? '#10b981' : '#ef4444' }}>
                                    {financeData.profit >= 0 ? 'En bénéfice' : 'En déficit'}
                                </div>
                            </div>
                        </div>

                        {/* Recent Expenses Table */}
                        <div className="card" style={{ padding: '0' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontWeight: 800 }}>Détail des Dépenses</h3>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f3f4f6' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Montant</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {financeData.expenses.length > 0 ? financeData.expenses.map(exp => (
                                        <tr key={exp._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '1rem' }}>{new Date(exp.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{exp.description}</td>
                                            <td style={{ padding: '1rem', color: '#ef4444', fontWeight: 700 }}>-{exp.amount.toFixed(2)}DH</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteExpense(exp._id)} style={{ color: '#ef4444' }}><X size={18} /></button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Aucune dépense sur cette période.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'tables' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {tables.map(table => (
                                <div key={table._id} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--glovo-green)', marginBottom: '1rem' }}>
                                        Table {table.number}
                                    </div>
                                    <div id={`qr-table-${table.number}`} style={{
                                        backgroundColor: 'white',
                                        padding: '1rem',
                                        borderRadius: '1rem',
                                        display: 'inline-block',
                                        marginBottom: '1rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        <QRCode
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?table=${table.number}`}
                                            size={150}
                                        />
                                    </div>
                                    <div style={{ color: 'var(--glovo-gray)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                        Capacité: {table.capacity} personnes
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handlePrintQR(table.number)}
                                            style={{ flex: 1, padding: '0.5rem', background: 'var(--glovo-yellow)', fontWeight: 700, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        >
                                            <Printer size={16} /> Imprimer
                                        </button>
                                        <button
                                            onClick={() => setEditingTable(table)}
                                            style={{ flex: 1, padding: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem' }}
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTable(table._id)}
                                            style={{ flex: 1, padding: '0.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem' }}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(showTableForm || editingTable) && (
                            <div style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1200
                            }}>
                                <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '2rem', width: '90%', maxWidth: '400px' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                                        {editingTable ? 'Modifier la Table' : 'Nouvelle Table'}
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Numéro de table</label>
                                            <input
                                                type="text"
                                                defaultValue={editingTable?.number || ''}
                                                id="table-number"
                                                className="input"
                                                placeholder="Ex: 5"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Capacité</label>
                                            <input
                                                type="number"
                                                defaultValue={editingTable?.capacity || 4}
                                                id="table-capacity"
                                                className="input"
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                            <button
                                                className="btn-primary"
                                                style={{ flex: 1 }}
                                                onClick={() => {
                                                    const number = document.getElementById('table-number').value;
                                                    const capacity = document.getElementById('table-capacity').value;
                                                    handleCreateTable({ number, capacity });
                                                }}
                                            >
                                                Sauvegarder
                                            </button>
                                            <button
                                                style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-xl)', border: '1px solid #ddd' }}
                                                onClick={() => { setShowTableForm(false); setEditingTable(null); }}
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div >
    );
}

