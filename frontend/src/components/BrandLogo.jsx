export default function BrandLogo({
  variant = 'sidebar', // 'sidebar' | 'login' | 'pass' | 'header'
  size,
  showSubtext = true,
  className = '',
}) {
  // 1. Sidebar Brand Emblem Card
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
            style={{ width: size || '100%', maxWidth: size || 185 }}
          />
        </div>

        {showSubtext && (
          <div className="brand-meta-badge">
            <div className="brand-metallic-divider" />
            <div className="brand-meta-row">
              <span className="brand-status-dot" />
              <span className="brand-tagline">TIGAT GYM • ትጋት ጂም</span>
            </div>
            <div className="brand-edition-chip">
              CORE SUITE • ADDIS ABABA
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Sign-In / Login Screen Showcase Emblem
  if (variant === 'login') {
    return (
      <div className={`brand-emblem-login ${className}`}>
        {/* Pulsing Concentric Aura Ring */}
        <div className="brand-aura-ring" />
        <div className="brand-aura-core" />

        {/* Framed Glass Podium */}
        <div className="brand-login-podium">
          <img
            src="/tigat-logo.png"
            alt="TIGAT GYM"
            className="brand-logo-img-stylish brand-logo-large"
            style={{ width: size || 165 }}
          />
        </div>

        {showSubtext && (
          <div className="brand-login-typography">
            <div className="brand-sub-amharic">ትጋት ጂም • ATHLETIC CLUB</div>
            <div className="brand-badge-pill">
              <span className="brand-status-dot" />
              <span>GYM MANAGEMENT SYSTEM • V1.0</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Digital Pass Holographic Seal
  if (variant === 'pass') {
    return (
      <div className={`brand-emblem-pass ${className}`}>
        <div className="brand-pass-podium">
          <img
            src="/tigat-logo.png"
            alt="TIGAT GYM"
            className="brand-logo-img-stylish brand-logo-pass"
            style={{ width: size || 54 }}
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
        style={{ width: size || 38, height: 'auto' }}
      />
      {showSubtext && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
            TIGAT GYM
          </span>
          <span style={{ fontSize: 10, color: '#ff8a00', fontWeight: 600 }}>
            ትጋት ጂም
          </span>
        </div>
      )}
    </div>
  );
}
