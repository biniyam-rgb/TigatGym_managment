export default function BrandLogo({
  variant = 'sidebar', // 'sidebar' | 'login' | 'pass' | 'header'
  size,
  showSubtext = true,
  className = '',
}) {
  // 1. Sidebar Brand Emblem Card (Refined, Compact & Luxury)
  if (variant === 'sidebar') {
    return (
      <div className={`brand-emblem-sidebar ${className}`}>
        {/* Ambient Backlight Halo */}
        <div className="brand-ambient-glow" />

        {/* Logo Visual with Screen Blend & Incandescent Orange Drop Shadow */}
        <div className="brand-logo-frame">
          <img
            src="/tigat-logo.png"
            alt="TIGAT GYM • ትጋት ጂም"
            className="brand-logo-img-stylish"
            style={{ width: size || 105, maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {showSubtext && (
          <div className="brand-meta-badge">
            <div className="brand-metallic-divider" />
            <div className="brand-edition-chip">
              <span className="brand-status-dot" />
              <span>CORE SUITE • ADDIS ABABA</span>
            </div>
          </div>
        )}
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
      <img
        src="/tigat-logo.png"
        alt="TIGAT GYM"
        className="brand-logo-img-stylish"
        style={{ width: size || 32, height: 'auto' }}
      />
      {showSubtext && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
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
