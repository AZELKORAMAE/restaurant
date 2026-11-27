/** Validates a location sent by a form. Returns null when absent/invalid. */
export function normalizeLocation(loc) {
    if (!loc || typeof loc !== 'object') return null;
    const lat = Number(loc.lat), lng = Number(loc.lng);
    if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) return null;
    const mapsUrl = typeof loc.mapsUrl === 'string' && /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(loc.mapsUrl)
        ? loc.mapsUrl.slice(0, 500) : undefined;
    return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, address: String(loc.address || '').slice(0, 300), mapsUrl };
}

/** Extracts coordinates from a (long) Google Maps URL. */
export function coordsFromGoogleUrl(url) {
    const s = decodeURIComponent(String(url || ''));
    const patterns = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/];
    for (const re of patterns) {
        const m = s.match(re);
        if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
    }
    return null;
}
