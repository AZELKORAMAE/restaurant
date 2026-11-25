"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Box, ScanLine, Upload, Wand2, Trash2, Sparkles, Info, Loader2 } from 'lucide-react';
import DishViewer3D from '@/components/ar/DishViewer3D';
import DishScanStudio from '@/components/admin/DishScanStudio';
import { uploadFile } from '@/lib/upload-client';

const SOURCE_LABEL = { scan: 'Scan 3D importé', ai: 'Reconstruction depuis vos photos', plate: 'Aperçu généré depuis la photo' };

const box = { padding: '1.5rem', background: '#f5f3ff', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' };
const btn = (bg = 'white') => ({ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '0.8rem', border: '1px solid #ddd', background: bg, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' });

/**
 * 3D section of the dish form. `model3d` is part of the form data; actions that need the
 * server (AI reconstruction, rescale) are only available once the dish has been saved (`dishId`).
 */
export default function Model3DPanel({ dishId, model3d = {}, photo, onChange, aiEnabled }) {
    const [studio, setStudio] = useState(false);
    const [busy, setBusy] = useState('');
    const [progress, setProgress] = useState(null);
    const pollRef = useRef(null);
    const m = { status: 'none', captureImages: [], realDiameterCm: 26, ...model3d };

    const set = (patch) => onChange({ ...m, ...patch });

    // Poll the AI reconstruction while it runs
    useEffect(() => {
        if (m.status !== 'processing' || !dishId) return;
        const tick = async () => {
            try {
                const res = await fetch(`/api/dishes/${dishId}/model3d`);
                const json = await res.json();
                if (json.success) onChange({ ...m, ...json.data });
            } catch { /* retry on next tick */ }
        };
        pollRef.current = setInterval(tick, 5000);
        return () => clearInterval(pollRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [m.status, dishId]);

    const importScan = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.toLowerCase().split('.').pop();
        if (!['glb', 'usdz'].includes(ext)) return alert('Formats acceptés : .glb (Android/Web) et .usdz (iPhone).');
        setBusy('upload');
        setProgress(0);
        try {
            const url = await uploadFile(file, { onProgress: setProgress });
            if (ext === 'glb') set({ glb: url, source: 'scan', status: 'ready', error: null });
            else set({ usdz: url });
        } catch (err) {
            alert("Erreur d'import : " + err.message);
        } finally {
            setBusy('');
            setProgress(null);
            e.target.value = '';
        }
    };

    const generatePreview = async () => {
        if (!photo) return alert("Ajoutez d'abord la photo principale du plat.");
        setBusy('plate');
        try {
            const { generatePlateGlb } = await import('@/lib/plate-generator');
            const blob = await generatePlateGlb(photo, { diameterCm: m.realDiameterCm || 26 });
            const url = await uploadFile(blob, { filename: 'apercu-3d.glb' });
            set({ glb: url, usdz: null, source: 'plate', status: 'ready', error: null });
        } catch (err) {
            alert("Impossible de générer l'aperçu : " + err.message);
        } finally {
            setBusy('');
        }
    };

    const reconstruct = async () => {
        if (!dishId) return alert('Enregistrez le plat une première fois, puis lancez la reconstruction.');
        setBusy('ai');
        try {
            // make sure the captured photos are saved on the dish first
            await fetch(`/api/dishes/${dishId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model3d: { captureImages: m.captureImages, realDiameterCm: m.realDiameterCm } }),
            });
            const res = await fetch(`/api/dishes/${dishId}/model3d`, { method: 'POST' });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            onChange({ ...m, ...json.data });
        } catch (err) {
            alert(err.message);
        } finally {
            setBusy('');
        }
    };

    const changeDiameter = async (cm) => {
        set({ realDiameterCm: cm });
        if (dishId && m.status === 'ready' && m.source !== 'scan') {
            const res = await fetch(`/api/dishes/${dishId}/model3d`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ realDiameterCm: cm }),
            });
            const json = await res.json();
            if (json.success) onChange({ ...m, ...json.data });
        }
    };

    const remove = () => {
        if (!confirm('Retirer le modèle 3D de ce plat ?')) return;
        set({ glb: null, usdz: null, source: null, status: 'none', error: null });
    };

    return (
        <div style={box}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Box size={18} /> Plat en 3D & réalité augmentée
                </h3>
                {m.status === 'ready' && <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#dcfce7', color: '#166534', padding: '0.25rem 0.6rem', borderRadius: '1rem' }}>{SOURCE_LABEL[m.source] || 'Modèle prêt'}</span>}
            </div>

            {m.status === 'ready' && m.glb && (
                <div style={{ marginBottom: '1rem' }}>
                    <DishViewer3D model3d={m} name="Aperçu" poster={photo} height={260} compact />
                </div>
            )}

            {m.status === 'processing' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', background: 'white', borderRadius: '0.8rem', marginBottom: '1rem' }}>
                    <Loader2 size={20} className="spin-slow" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Reconstruction 3D en cours… {m.progress ? `${m.progress}%` : ''}</div>
                        <div style={{ height: 6, background: '#eee', borderRadius: 3, marginTop: 6 }}>
                            <div style={{ height: '100%', width: `${m.progress || 3}%`, background: '#8b5cf6', borderRadius: 3, transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--glovo-gray)', marginTop: 4 }}>Comptez 2 à 5 minutes. Vous pouvez fermer cette fenêtre.</div>
                    </div>
                </div>
            )}

            {m.status === 'failed' && m.error && (
                <div style={{ padding: '0.8rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.8rem', fontSize: '0.85rem', marginBottom: '1rem' }}>{m.error}</div>
            )}

            {/* 1. Scan */}
            <div style={{ display: 'grid', gap: '0.8rem' }}>
                <div style={{ background: 'white', borderRadius: '0.8rem', padding: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>① Scanner le plat avec la caméra</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginBottom: '0.7rem' }}>
                        Posez le plat sur une table bien éclairée, puis faites le tour en 3 hauteurs (24 à 40 photos).
                    </p>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button type="button" onClick={() => setStudio(true)} style={btn('var(--glovo-yellow)')}><ScanLine size={18} /> Lancer le scan</button>
                        {m.captureImages?.length > 0 && (
                            <>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.captureImages.length} photos</span>
                                <button type="button" onClick={() => set({ captureImages: [] })} style={{ ...btn(), padding: '0.4rem 0.6rem' }}><Trash2 size={14} /></button>
                            </>
                        )}
                    </div>
                    {m.captureImages?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginTop: '0.7rem' }}>
                            {m.captureImages.slice(0, 20).map((u) => <img key={u} src={u} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />)}
                        </div>
                    )}
                    {m.captureImages?.length > 0 && (
                        <div style={{ marginTop: '0.8rem' }}>
                            {aiEnabled ? (
                                <button type="button" onClick={reconstruct} disabled={busy === 'ai' || m.status === 'processing'} style={btn('#ede9fe')}>
                                    <Sparkles size={18} /> {busy === 'ai' ? 'Envoi…' : 'Créer le modèle 3D à partir des photos'}
                                </button>
                            ) : (
                                <p style={{ fontSize: '0.78rem', color: 'var(--glovo-gray)', display: 'flex', gap: 6 }}>
                                    <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                    La reconstruction automatique n’est pas activée sur la plateforme. Vos photos sont conservées ; utilisez ② ou ③ en attendant.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Import from a scanning app */}
                <div style={{ background: 'white', borderRadius: '0.8rem', padding: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>② Importer un scan 3D (.glb / .usdz)</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginBottom: '0.7rem' }}>
                        Meilleure qualité : scannez le plat avec une application de photogrammétrie (Polycam, KIRI Engine, Scaniverse, Reality Composer sur iPhone…) et exportez en GLB.
                    </p>
                    <label style={{ ...btn(), display: 'inline-flex' }}>
                        <Upload size={18} /> {busy === 'upload' ? `Import… ${Math.round((progress || 0) * 100)}%` : 'Choisir un fichier'}
                        <input type="file" hidden accept=".glb,.usdz,model/gltf-binary,model/vnd.usdz+zip" onChange={importScan} disabled={!!busy} />
                    </label>
                    {m.usdz && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>USDZ iPhone ✓</span>}
                </div>

                {/* 3. Instant preview */}
                <div style={{ background: 'white', borderRadius: '0.8rem', padding: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>③ Aperçu 3D instantané depuis la photo</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginBottom: '0.7rem' }}>
                        Crée une assiette en 3D à taille réelle avec la photo du plat : idéal pour commencer tout de suite.
                    </p>
                    <button type="button" onClick={generatePreview} disabled={!!busy || !photo} style={btn()}>
                        <Wand2 size={18} /> {busy === 'plate' ? 'Génération…' : 'Générer l’aperçu'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Diamètre réel de l’assiette (cm)&nbsp;
                    <input type="number" min={5} max={120} value={m.realDiameterCm || 26}
                        onChange={(e) => set({ realDiameterCm: Number(e.target.value) })}
                        onBlur={(e) => changeDiameter(Number(e.target.value))}
                        style={{ width: 70, padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid #ddd' }} />
                </label>
                {m.status === 'ready' && (
                    <button type="button" onClick={remove} style={{ ...btn(), color: '#b91c1c' }}><Trash2 size={16} /> Retirer le modèle</button>
                )}
            </div>

            {studio && (
                <DishScanStudio
                    initialPhotos={m.captureImages || []}
                    onClose={() => setStudio(false)}
                    onDone={(urls) => { set({ captureImages: urls }); setStudio(false); }}
                />
            )}
        </div>
    );
}
