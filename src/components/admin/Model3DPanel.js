"use client";
import React, { useEffect, useState } from 'react';
import { Box, ScanLine, Upload, Wand2, Trash2, Sparkles, Info, Loader2, SlidersHorizontal, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import DishViewer3D from '@/components/ar/DishViewer3D';
import DishScanStudio from '@/components/admin/DishScanStudio';
import ModelStudio from '@/components/admin/ModelStudio';
import { uploadFile } from '@/lib/upload-client';

const SOURCE_LABEL = { scan: 'Scan 3D réel', ai: 'Reconstruction IA', plate: 'Aperçu depuis la photo' };

const box = { padding: '1.5rem', background: '#f7f3ec', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' };
const card = { background: 'white', borderRadius: '0.9rem', padding: '1rem' };
const btn = (bg = 'white', color = 'var(--glovo-dark)') => ({ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '0.8rem', border: '1px solid #ddd', background: bg, color, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' });

const LUXURY_TIPS = [
    ['Lumière', 'Lumière du jour douce ou deux lampes diffuses. Pas de spot direct, pas de flash : aucune ombre dure ni reflet.'],
    ['Fond', 'Posez le plat sur une table unie et mate (nappe, bois clair). Dégagez tout autour : verres, couverts, mains.'],
    ['Le plat', 'Dressage final, sauce bien nette, bords d’assiette essuyés. Ne touchez plus au plat pendant le scan.'],
    ['Les photos', '3 tours complets : au-dessus, à hauteur d’épaule, presque au ras de la table. 40 à 60 photos, chacune nette, le plat entier dans le cadre.'],
    ['Mouvement', 'C’est vous qui tournez autour du plat, à pas réguliers (une photo tous les 20-30 cm). Ne faites pas tourner l’assiette.'],
    ['Après', 'Ouvrez le Studio 3D : mettez le plat à niveau, entrez son diamètre réel mesuré au mètre, retirez la table. C’est ce qui donne un rendu « vitrine ».'],
];

/**
 * 3D section of the dish form. `model3d` is part of the form data; actions that need the
 * server (automatic scan, studio) are available once the dish has been saved (`dishId`).
 */
export default function Model3DPanel({ dishId, model3d = {}, photo, onChange, features = {}, canAutoScan = false }) {
    const [captureOpen, setCaptureOpen] = useState(false);
    const [studioOpen, setStudioOpen] = useState(false);
    const [tipsOpen, setTipsOpen] = useState(false);
    const [busy, setBusy] = useState('');
    const [progress, setProgress] = useState(null);
    const m = { status: 'none', captureImages: [], realDiameterCm: 26, ...model3d };
    const minPhotos = features.minScanPhotos || 20;

    const set = (patch) => onChange({ ...m, ...patch });

    // Poll the automatic reconstruction while it runs
    useEffect(() => {
        if (m.status !== 'processing' || !dishId) return;
        const t = setInterval(async () => {
            try {
                const json = await (await fetch(`/api/dishes/${dishId}/model3d`)).json();
                if (json.success) onChange((prev) => ({ ...(prev || {}), ...json.data }));
            } catch { /* retry on next tick */ }
        }, 6000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [m.status, dishId]);

    /** Saves a new 3D file on the dish right away (it goes through the server pipeline). */
    const attach = async (fields) => {
        if (!dishId) { set({ ...fields, status: 'ready' }); return; } // new dish: saved with the form
        const res = await fetch(`/api/dishes/${dishId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model3d: { ...fields, realDiameterCm: m.realDiameterCm } }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        onChange(json.data.model3d);
    };

    const importScan = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const ext = file.name.toLowerCase().split('.').pop();
        if (!['glb', 'usdz'].includes(ext)) return alert('Formats acceptés : .glb (Android / Web) et .usdz (iPhone).');
        setBusy('upload');
        setProgress(0);
        try {
            const url = await uploadFile(file, { onProgress: setProgress });
            if (ext === 'usdz') set({ usdz: url });
            else { setBusy('process'); await attach({ glb: url, source: 'scan' }); }
        } catch (err) {
            alert("Erreur d'import : " + err.message);
        } finally {
            setBusy('');
            setProgress(null);
        }
    };

    const generatePreview = async () => {
        if (!photo) return alert("Ajoutez d'abord la photo principale du plat.");
        setBusy('plate');
        try {
            const { generatePlateGlb } = await import('@/lib/plate-generator');
            const blob = await generatePlateGlb(photo, { diameterCm: m.realDiameterCm || 26 });
            const url = await uploadFile(blob, { filename: 'apercu-3d.glb' });
            await attach({ glb: url, source: 'plate' });
        } catch (err) {
            alert("Impossible de générer l'aperçu : " + err.message);
        } finally {
            setBusy('');
        }
    };

    const autoScan = async () => {
        if (!dishId) return alert('Enregistrez le plat une première fois, puis lancez le scan automatique.');
        setBusy('auto');
        try {
            await fetch(`/api/dishes/${dishId}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model3d: { captureImages: m.captureImages, realDiameterCm: m.realDiameterCm } }),
            });
            const json = await (await fetch(`/api/dishes/${dishId}/model3d`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
            if (!json.success) throw new Error(json.error);
            onChange({ ...m, ...json.data });
        } catch (err) {
            alert(err.message);
        } finally {
            setBusy('');
        }
    };

    const remove = () => {
        if (!confirm('Retirer le modèle 3D de ce plat ?')) return;
        set({ glb: null, usdz: null, source: null, status: 'none', error: null, dimensions: null });
    };

    const d = m.dimensions;
    const enoughPhotos = m.captureImages?.length >= minPhotos;

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
                    <DishViewer3D model3d={m} name="Aperçu" poster={photo} height={280} compact />
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                        {d?.widthCm ? <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Taille réelle : {d.widthCm} × {d.depthCm} × {d.heightCm} cm</span> : null}
                        <span style={{ flex: 1 }} />
                        {dishId ? (
                            <button type="button" onClick={() => setStudioOpen(true)} style={btn('#1a1a1a', 'white')}><SlidersHorizontal size={16} /> Studio 3D</button>
                        ) : <span style={{ fontSize: '0.75rem', color: 'var(--glovo-gray)' }}>Enregistrez le plat pour ouvrir le Studio 3D</span>}
                        <button type="button" onClick={remove} style={{ ...btn(), color: '#b91c1c' }} aria-label="Retirer le modèle"><Trash2 size={16} /></button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--glovo-gray)', marginTop: 6 }}>
                        Studio 3D : mise à niveau, taille réelle exacte, suppression de la table, qualité. Indispensable pour un rendu haut de gamme.
                    </p>
                </div>
            )}

            {m.status === 'processing' && (
                <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                    <Loader2 size={20} className="spin-slow" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.provider === 'kiri' ? 'Photogrammétrie en cours' : 'Reconstruction 3D en cours'}… {m.progress ? `${m.progress}%` : ''}</div>
                        <div style={{ height: 6, background: '#eee', borderRadius: 3, marginTop: 6 }}>
                            <div style={{ height: '100%', width: `${m.progress || 3}%`, background: '#b8892f', borderRadius: 3, transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--glovo-gray)', marginTop: 4 }}>{m.provider === 'kiri' ? 'Comptez 10 à 30 minutes' : 'Comptez 2 à 5 minutes'}. Vous pouvez fermer cette fenêtre, le résultat apparaîtra ici.</div>
                    </div>
                </div>
            )}

            {(busy === 'process' || busy === 'plate') && (
                <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <Loader2 size={18} className="spin-slow" /> Optimisation du modèle : mise à l’échelle réelle, nettoyage, textures…
                </div>
            )}

            {m.status === 'failed' && m.error && (
                <div style={{ padding: '0.8rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.8rem', fontSize: '0.85rem', marginBottom: '1rem' }}>{m.error}</div>
            )}

            {/* Guide */}
            <div style={{ ...card, marginBottom: '0.8rem', border: '1px solid #ead9b8' }}>
                <button type="button" onClick={() => setTipsOpen((v) => !v)} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Sparkles size={16} color="#b8892f" /> Guide pour un rendu « vitrine »</span>
                    {tipsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {tipsOpen && (
                    <ol style={{ margin: '0.8rem 0 0 1.1rem', display: 'grid', gap: 6, fontSize: '0.82rem' }}>
                        {LUXURY_TIPS.map(([t, d2]) => <li key={t}><strong>{t}.</strong> {d2}</li>)}
                    </ol>
                )}
            </div>

            <div style={{ display: 'grid', gap: '0.8rem' }}>
                {/* 1. Scan */}
                <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>① Scanner le plat avec la caméra</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginBottom: '0.7rem' }}>
                        Capture guidée en 3 hauteurs avec contrôle de netteté. {features.photogrammetry ? `${minPhotos} photos minimum pour la photogrammétrie (idéal : 40 à 60).` : ''}
                    </p>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button type="button" onClick={() => setCaptureOpen(true)} style={btn('var(--glovo-yellow)')}><ScanLine size={18} /> {m.captureImages?.length ? 'Compléter le scan' : 'Lancer le scan'}</button>
                        {m.captureImages?.length > 0 && (
                            <>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: enoughPhotos ? '#166534' : '#92400e' }}>{m.captureImages.length} photos{features.photogrammetry && !enoughPhotos ? ` (min. ${minPhotos})` : ''}</span>
                                <button type="button" onClick={() => confirm('Supprimer toutes les photos du scan ?') && set({ captureImages: [] })} style={{ ...btn(), padding: '0.4rem 0.6rem' }} aria-label="Supprimer les photos"><Trash2 size={14} /></button>
                            </>
                        )}
                    </div>
                    {m.captureImages?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginTop: '0.7rem' }}>
                            {m.captureImages.slice(0, 24).map((u) => <img key={u} src={u} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />)}
                        </div>
                    )}
                    {m.captureImages?.length > 0 && (
                        <div style={{ marginTop: '0.8rem' }}>
                            {!features.autoScan ? (
                                <p style={{ fontSize: '0.78rem', color: 'var(--glovo-gray)', display: 'flex', gap: 6 }}>
                                    <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                    Le scan automatique n’est pas encore activé sur la plateforme. Vos photos sont conservées ; utilisez ② en attendant.
                                </p>
                            ) : !canAutoScan ? (
                                <p style={{ fontSize: '0.8rem', color: '#92400e', display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <Crown size={15} /> La transformation automatique des photos en 3D est incluse dans l’offre <strong>Premium</strong> (onglet Abonnement).
                                </p>
                            ) : (
                                <button type="button" onClick={autoScan} disabled={busy === 'auto' || m.status === 'processing' || (features.photogrammetry && !enoughPhotos)} style={btn('linear-gradient(135deg,#1a1a1a,#4a3a1e)', 'white')}>
                                    <Sparkles size={18} color="#FFC244" /> {busy === 'auto' ? 'Envoi des photos…' : features.photogrammetry ? 'Créer le scan 3D (photogrammétrie 4K)' : 'Créer le modèle 3D'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Import */}
                <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>② Importer un scan 3D (.glb / .usdz)</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginBottom: '0.7rem' }}>
                        Qualité maximale : scannez avec Polycam, KIRI Engine, Scaniverse ou Reality Composer (iPhone, « Object Capture »), exportez en GLB. Le fichier est automatiquement centré, posé sur la table, optimisé.
                    </p>
                    <label style={{ ...btn(), display: 'inline-flex' }}>
                        <Upload size={18} /> {busy === 'upload' ? `Import… ${Math.round((progress || 0) * 100)}%` : busy === 'process' ? 'Optimisation…' : 'Choisir un fichier'}
                        <input type="file" hidden accept=".glb,.usdz,model/gltf-binary,model/vnd.usdz+zip" onChange={importScan} disabled={!!busy} />
                    </label>
                    {m.usdz && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>USDZ iPhone ✓</span>}
                </div>

                {/* 3. Instant preview */}
                <div style={card}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>③ Aperçu 3D instantané depuis la photo</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--glovo-gray)', marginBottom: '0.7rem' }}>
                        Une assiette en 3D au diamètre réel avec la photo du plat, en attendant un vrai scan.
                    </p>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button type="button" onClick={generatePreview} disabled={!!busy || !photo} style={btn()}>
                            <Wand2 size={18} /> {busy === 'plate' ? 'Génération…' : 'Générer l’aperçu'}
                        </button>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            Diamètre de l’assiette&nbsp;
                            <input type="number" min={5} max={120} value={m.realDiameterCm || 26}
                                onChange={(e) => set({ realDiameterCm: Number(e.target.value) })}
                                style={{ width: 64, padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid #ddd' }} /> cm
                        </label>
                    </div>
                </div>
            </div>

            {captureOpen && (
                <DishScanStudio
                    initialPhotos={m.captureImages || []}
                    minPhotos={features.photogrammetry ? minPhotos : 8}
                    onClose={() => setCaptureOpen(false)}
                    onDone={(urls) => { set({ captureImages: urls }); setCaptureOpen(false); }}
                />
            )}
            {studioOpen && (
                <ModelStudio
                    dishId={dishId}
                    model3d={m}
                    onClose={() => setStudioOpen(false)}
                    onApplied={(next) => { onChange(next); setStudioOpen(false); }}
                />
            )}
        </div>
    );
}
