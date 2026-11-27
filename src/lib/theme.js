// Look of a restaurant's site: cover presets, accent colours and helpers shared by
// the public menu and the live previews (registration, settings).

export const COVER_PRESETS = [
    { id: 'bistro', label: 'Bistrot chaleureux', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80' },
    { id: 'table', label: 'Table dressée', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80' },
    { id: 'moroccan', label: 'Saveurs marocaines', url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=1920&q=80' },
    { id: 'grill', label: 'Grill & braise', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80' },
    { id: 'cafe', label: 'Café lumineux', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80' },
    { id: 'dark', label: 'Gastronomique', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1920&q=80' },
];

export const ACCENTS = [
    { color: '#FFC244', name: 'Safran' },
    { color: '#E07A5F', name: 'Terracotta' },
    { color: '#C9A46A', name: 'Or' },
    { color: '#2A9D8F', name: 'Menthe' },
    { color: '#264653', name: 'Nuit' },
    { color: '#9B2335', name: 'Bordeaux' },
    { color: '#1A1A1A', name: 'Noir' },
];

export const DEFAULT_THEME = { accent: '#FFC244', overlay: 0.45, focalX: 50, focalY: 50 };

export function normalizeTheme(t = {}) {
    const clamp = (v, min, max, d) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : d);
    return {
        accent: /^#[0-9a-f]{6}$/i.test(t.accent || '') ? t.accent : DEFAULT_THEME.accent,
        overlay: clamp(t.overlay, 0, 0.85, DEFAULT_THEME.overlay),
        focalX: clamp(t.focalX, 0, 100, 50),
        focalY: clamp(t.focalY, 0, 100, 50),
    };
}

/** Text colour that stays readable on the accent colour. */
export function inkFor(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    if (!m) return '#1a1a1a';
    const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#1a1a1a' : '#ffffff';
}

/** CSS variables that re-brand the menu (buttons, badges, highlights). */
export function brandVars(theme) {
    const t = normalizeTheme(theme);
    return { '--glovo-yellow': t.accent, '--brand': t.accent, '--brand-ink': inkFor(t.accent) };
}

export function mapsLinks(location) {
    if (!location?.lat || !location?.lng) return null;
    const q = `${location.lat},${location.lng}`;
    return {
        embed: `https://www.google.com/maps?q=${q}&z=16&output=embed`,
        open: location.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${q}`,
        directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    };
}
