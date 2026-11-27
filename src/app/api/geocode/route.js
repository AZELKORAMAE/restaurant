import { handler, ok, HttpError } from '@/lib/api';
import { coordsFromGoogleUrl } from '@/lib/location';

// Address search / reverse geocoding (OpenStreetMap Nominatim) and Google Maps link resolution,
// used by the location picker (registration and restaurant settings).
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const UA = 'Menu3D/1.0 (restaurant menu platform)';
const cache = new Map();
let last = 0;

async function nominatim(path) {
    if (cache.has(path)) return cache.get(path);
    const wait = last + 1100 - Date.now(); // Nominatim policy: max 1 request per second
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    const res = await fetch(`${NOMINATIM}${path}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr' }, cache: 'no-store' });
    if (!res.ok) throw new HttpError(502, 'Service de cartes indisponible, réessayez.');
    const data = await res.json();
    if (cache.size > 500) cache.clear();
    cache.set(path, data);
    return data;
}

const place = (p) => ({ lat: Number(p.lat), lng: Number(p.lon), address: p.display_name });

const GOOGLE_HOSTS = /^(www\.)?(google\.[a-z.]+|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl)$/i;

async function resolveGoogle(raw) {
    let url;
    try { url = new URL(raw); } catch { throw new HttpError(400, 'Lien invalide.'); }
    if (!GOOGLE_HOSTS.test(url.hostname)) throw new HttpError(400, 'Collez un lien Google Maps (bouton « Partager » dans Google Maps).');
    // Short links (maps.app.goo.gl) redirect to the full URL that contains the coordinates.
    for (let i = 0; i < 4 && !coordsFromGoogleUrl(url.href); i++) {
        const res = await fetch(url.href, { redirect: 'manual', cache: 'no-store', headers: { 'User-Agent': UA } });
        const next = res.headers.get('location');
        if (!next) break;
        const u = new URL(next, url);
        if (!GOOGLE_HOSTS.test(u.hostname) && !/(^|\.)google\.[a-z.]+$/i.test(u.hostname)) break;
        url = u;
    }
    const coords = coordsFromGoogleUrl(url.href);
    if (!coords) {
        const name = decodeURIComponent(url.pathname.match(/\/place\/([^/]+)/)?.[1] || '').replace(/\+/g, ' ');
        if (name) {
            const found = await nominatim(`/search?format=jsonv2&limit=1&q=${encodeURIComponent(name)}`);
            if (found[0]) return { ...place(found[0]), mapsUrl: raw };
        }
        throw new HttpError(422, 'Impossible de lire la position dans ce lien. Placez le repère sur la carte.');
    }
    const rev = await nominatim(`/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`).catch(() => null);
    return { ...coords, address: rev?.display_name || '', mapsUrl: raw };
}

export const GET = handler(async (request) => {
    const sp = new URL(request.url).searchParams;
    const q = (sp.get('q') || '').trim();
    const link = (sp.get('url') || '').trim();
    if (link) return ok([await resolveGoogle(link)]);
    if (sp.has('lat') && sp.has('lng')) {
        const lat = Number(sp.get('lat')), lng = Number(sp.get('lng'));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new HttpError(400, 'Coordonnées invalides.');
        const r = await nominatim(`/reverse?format=jsonv2&lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}`);
        return ok([{ lat, lng, address: r?.display_name || '' }]);
    }
    if (q.length < 3) return ok([]);
    const results = await nominatim(`/search?format=jsonv2&limit=6&q=${encodeURIComponent(q.slice(0, 200))}`);
    return ok(results.map(place));
});
