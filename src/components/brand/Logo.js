/**
 * Logo 3D Restaurant : un plat sous cloche, surmonté d'un cube en 3D.
 * tone="light" pour fond sombre (texte blanc), tone="dark" pour fond clair.
 */
export function LogoMark({ size = 40, title }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
            <defs>
                <linearGradient id="lr3d-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFD166" />
                    <stop offset="1" stopColor="#FF7A1A" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="13" fill="url(#lr3d-bg)" />
            {/* cube 3D */}
            <path d="M24 7.5l6.5 3.75L24 15l-6.5-3.75z" fill="#fff" />
            <path d="M17.5 11.25L24 15v7.5l-6.5-3.75z" fill="#1A1A1A" opacity="0.72" />
            <path d="M30.5 11.25L24 15v7.5l6.5-3.75z" fill="#1A1A1A" />
            {/* cloche + assiette */}
            <path d="M11 34a13 10.5 0 0 1 26 0z" fill="#1A1A1A" />
            <path d="M15.5 30.5a9 7 0 0 1 5.5-5" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <rect x="7.5" y="35.5" width="33" height="3.2" rx="1.6" fill="#1A1A1A" />
        </svg>
    );
}

export default function Logo({ size = 40, tone = 'light', withText = true }) {
    const text = tone === 'light' ? '#fff' : '#1A1A1A';
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>
            <LogoMark size={size} title={withText ? undefined : '3D Restaurant'} />
            {withText && (
                <span style={{ fontFamily: 'var(--font-sora), var(--font-outfit), sans-serif', fontWeight: 800, fontSize: size * 0.5, letterSpacing: '-0.03em', color: text, lineHeight: 1, whiteSpace: 'nowrap' }}>
                    <span style={{ background: 'linear-gradient(135deg,#FFD166,#FF7A1A)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>3D</span> Restaurant
                </span>
            )}
        </span>
    );
}
