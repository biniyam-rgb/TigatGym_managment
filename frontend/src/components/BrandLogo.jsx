// SVG Dumbbell Icon matching the login screen brand emblem (Crisp White, No Shadow)
const DumbbellIcon = ({ iconSize = 20, strokeWidth = 2.8, strokeColor = '#ffffff' }) => (
  <svg
    width={iconSize}
    height={iconSize}
    viewBox="0 0 24 24"
    fill="none"
    stroke={strokeColor}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12" />
  </svg>
);

export default function BrandLogo({
  variant = 'sidebar', // 'sidebar' | 'login' | 'pass' | 'header' | 'reception'
  size,
  showSubtext = true,
  className = '',
}) {

  // 1. Sidebar Brand Lockup (Matches the Login Brand Identity)
  // [ Orange Dumbbell Badge ] + TIGAT (white in dark mode, dark in light mode) + GYM (orange #FF7A00)
  if (variant === 'sidebar') {
    return (
      <div
        className={`brand-sidebar-lockup gymcore-split-brand-header ${className}`}
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: '100%',
        }}
      >
        {/* Vibrant Orange Brand Badge with crisp dumbbell */}
        <div
          className="gymcore-split-brand-badge"
          style={{
            width: size || 34,
            height: size || 34,
            background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'none',
          }}
        >
          <DumbbellIcon iconSize={size ? Math.round(size * 0.6) : 20} strokeWidth={2.8} />
        </div>

        {/* Brand Typography matching Login screen */}
        <div className="brand-title-wrap" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            className="gymcore-split-brand-text"
            style={{
              fontSize: size ? Math.max(15, Math.round(size * 0.5)) : 18,
              fontWeight: 900,
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              lineHeight: 1.15,
            }}
          >
            <span className="brand-text-tigat brand-title-bold">
              TIGAT
            </span>
            <span className="brand-text-gym brand-orange" style={{ color: '#ff7a00' }}>
              GYM
            </span>
          </div>
          {showSubtext && (
            <span
              className="brand-subtext-clean"
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#ea580c',
                letterSpacing: '0.08em',
                marginTop: 2,
              }}
            >
              FITNESS FOR LIFE
            </span>
          )}
        </div>
      </div>
    );
  }

  // 2. Sign-In / Login Screen Showcase Emblem
  if (variant === 'login') {
    return (
      <div className={`gymcore-split-brand-header ${className}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="gymcore-split-brand-badge" style={{ width: size || 40, height: size || 40, borderRadius: 8 }}>
          <DumbbellIcon iconSize={size ? Math.round(size * 0.6) : 24} strokeWidth={2.8} />
        </div>
        <div className="gymcore-split-brand-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="brand-text-tigat brand-title-bold">TIGAT</span>
          <span className="brand-orange" style={{ color: '#ff7a00' }}>GYM</span>
        </div>
      </div>
    );
  }

  // 3. Digital Pass Holographic Seal (Compact Crest)
  if (variant === 'pass') {
    return (
      <div className={`brand-emblem-pass ${className}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: size || 34,
            height: size || 34,
            background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
          }}
        >
          <DumbbellIcon iconSize={size ? Math.round(size * 0.58) : 19} strokeWidth={2.6} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: 1.15, display: 'flex', gap: 4 }}>
            <span className="brand-text-tigat">TIGAT</span>{' '}
            <span className="brand-text-gym" style={{ color: '#ff7a00' }}>GYM</span>
          </div>
          {showSubtext && <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>OFFICIAL PASS</div>}
        </div>
      </div>
    );
  }

  // 4. Compact Header / Minimal Badge / Reception
  return (
    <div className={`brand-emblem-compact gymcore-split-brand-header ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: size || 32,
          height: size || 32,
          background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
          flexShrink: 0,
        }}
      >
        <DumbbellIcon iconSize={size ? Math.round(size * 0.6) : 18} strokeWidth={2.6} />
      </div>
      {showSubtext && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', gap: 4 }}>
            <span className="brand-text-tigat">TIGAT</span>{' '}
            <span className="brand-text-gym" style={{ color: '#ff7a00' }}>GYM</span>
          </div>
          <span style={{ fontSize: 8.5, color: '#ea580c', fontWeight: 700, letterSpacing: '0.05em' }}>
            FITNESS FOR LIFE
          </span>
        </div>
      )}
    </div>
  );
}
