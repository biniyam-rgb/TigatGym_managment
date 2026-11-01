export default function BrandLogo({
  variant = 'sidebar', // 'sidebar' | 'login' | 'pass' | 'header'
  size,
  showSubtext = true,
  className = '',
}) {
  // 1. Sidebar Brand Lockup matching user reference image:
  // [ Authentic Tigat Tiger Crest Logo ] + TIGAT GYM 📶 + ትጋት ጂም
  if (variant === 'sidebar') {
    return (
      <div className={`brand-sidebar-lockup ${className}`}>
        {/* Authentic Tigat Tiger Crest Tile */}
        <div className="brand-tiger-tile">
          <img
            src="/tigat-tiger-logo.png"
            alt="Tigat Gym Crest"
            className="brand-sidebar-tiger-img"
          />
        </div>

        {/* Brand Typography & Green Live Signal Waves */}
        <div className="brand-title-wrap">
          <div className="brand-title-line">
            <span className="brand-title-bold">TIGAT GYM</span>
            <span className="brand-signal-wifi" title="Live System Connected">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1.2" fill="#10b981" stroke="none" />
              </svg>
            </span>
          </div>
          {showSubtext && (
            <span className="brand-subtext-amharic">ትጋት ጂም • BOLE</span>
          )}
        </div>
      </div>
    );
  }

  // 2. Sign-In / Login Screen Showcase Emblem (Balanced & Compact)
  if (variant === 'login') {
    return (
      <div className={`brand-emblem-login ${className}`}>
        {/* Soft Radial Ambient Aura Ring */}
        <div className="brand-aura-ring" />

        {/* Compact Framed Glass Podium */}
        <div className="brand-login-podium">
          <img
            src="/tigat-logo.png"
            alt="TIGAT GYM"
            className="brand-logo-img-stylish"
            style={{ width: size || 110, maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {showSubtext && (
          <div className="brand-login-typography">
            <div className="brand-badge-pill">
              <span className="brand-status-dot" />
              <span>GYMCORE • MANAGEMENT PORTAL</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Digital Pass Holographic Seal (Compact Crest)
  if (variant === 'pass') {
    return (
      <div className={`brand-emblem-pass ${className}`}>
        <div className="brand-pass-podium">
          <img
            src="/tigat-logo.png"
            alt="TIGAT GYM"
            className="brand-logo-img-stylish brand-logo-pass"
            style={{ width: size || 38, height: 'auto' }}
          />
        </div>
      </div>
    );
  }

  // 4. Compact Header / Minimal Badge
  return (
    <div className={`brand-emblem-compact ${className}`}>
      <div className="brand-orange-tile" style={{ width: 32, height: 32, borderRadius: 8 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="2" fill="#fff" />
          <path d="M9 13l3-3 3 3M12 10v9M8.5 21h7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {showSubtext && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
            TIGAT GYM
          </span>
          <span style={{ fontSize: 9, color: '#ff8a00', fontWeight: 600 }}>
            ትጋት ጂም
          </span>
        </div>
      )}
    </div>
  );
}
