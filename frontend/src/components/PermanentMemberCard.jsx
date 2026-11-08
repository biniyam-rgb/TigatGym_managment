import { useState } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import apiClient from '../services/api';

/**
 * Format any date into the official card format: '15 MAY 2024' / '07 NOV 2026'
 */
function formatCardDate(dateVal) {
  if (!dateVal) return 'N/A';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const [y, m, d] = dateVal.slice(0, 10).split('-').map(Number);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[m - 1] || 'JAN';
    const day = String(d).padStart(2, '0');
    return `${day} ${month} ${y}`;
  }
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Calculate exactly 1 full year from starting date for the permanent card expiration
 */
function calculateOneYearExpiry(dateVal) {
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const [y, m, d] = dateVal.slice(0, 10).split('-').map(Number);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[m - 1] || 'JAN';
    const day = String(d).padStart(2, '0');
    return `${day} ${month} ${y + 1}`;
  }
  const date = new Date(dateVal || Date.now());
  const yearLater = new Date(date);
  yearLater.setFullYear(yearLater.getFullYear() + 1);
  return formatCardDate(yearLater);
}

// Crisp Lucide-style SVG Icons
const CardIcons = {
  User: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Calendar: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Printer: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Rotate: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  Mail: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7" />
    </svg>
  ),
};

export default function PermanentMemberCard({
  member,
  membershipTitle = 'PREMIUM MEMBER',
  fallbackStartDate = null,
  showActions = true,
  onPrint = null,
}) {
  const [cardSide, setCardSide] = useState('back'); // 'back' (Details & QR) or 'front' (Gym Brand)
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  if (!member) return null;

  // Compute dates: 1 year permanent validity
  const rawStart = member.joined_at || fallbackStartDate || new Date().toISOString().split('T')[0];
  const joiningDateFormatted = formatCardDate(rawStart);
  const validThruFormatted = member.card_expires_at
    ? formatCardDate(member.card_expires_at)
    : calculateOneYearExpiry(rawStart);

  const memberCode = member.member_code || 'TG-0001';
  const memberName = (member.name || 'GYM MEMBER').toUpperCase();
  const qrToken = member.qr_code_token || member.qr_token || memberCode;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleEmailCard = async () => {
    if (!member?.id) return;
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await apiClient.sendMemberCardEmail(member.id);
      setEmailStatus({ success: true, message: res.message || 'Member card emailed successfully!' });
      setTimeout(() => setEmailStatus(null), 4000);
    } catch (err) {
      setEmailStatus({ success: false, message: err.message || 'Could not send email to member.' });
      setTimeout(() => setEmailStatus(null), 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="permanent-card-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {/* Side Toggle Tabs */}
      {showActions && (
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setCardSide('back')}
            style={{
              background: cardSide === 'back' ? '#ff7a00' : '#f1f5f9',
              color: cardSide === 'back' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: 11.5,
              padding: '5px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Member ID & QR Card
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setCardSide('front')}
            style={{
              background: cardSide === 'front' ? '#ff7a00' : '#f1f5f9',
              color: cardSide === 'front' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: 11.5,
              padding: '5px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Card Front Cover
          </button>
        </div>
      )}

      {/* Official Physical Card Container (Standard CR80 Landscape Ratio) */}
      <div
        id="printable-member-card"
        className="official-pvc-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          aspectRatio: '1.586 / 1',
          minHeight: 285,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '22px 24px',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Subtle Top-Left Orange Dot Matrix Graphic */}
        <svg
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            width: 55,
            height: 55,
            pointerEvents: 'none',
            zIndex: 0,
          }}
          viewBox="0 0 55 55"
          fill="none"
        >
          {[0, 1, 2, 3, 4].map(row =>
            [0, 1, 2, 3, 4].map(col => (
              <circle
                key={`${row}-${col}`}
                cx={col * 11 + 5}
                cy={row * 11 + 5}
                r={1.2}
                fill="#ea580c"
                opacity={(5 - row) * (5 - col) * 0.032}
              />
            ))
          )}
        </svg>

        {/* Bottom-Right Luxury Orange Curved Swoop Accents */}
        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 140,
            height: 90,
            pointerEvents: 'none',
            zIndex: 0,
          }}
          viewBox="0 0 140 90"
          fill="none"
        >
          <defs>
            <linearGradient id="pvcCornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8a00" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          {/* Outer thin accent arc */}
          <path
            d="M 15 90 C 45 42, 95 18, 140 10"
            stroke="#ff7a00"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Inner solid gradient wedge */}
          <path
            d="M 42 90 C 72 52, 110 30, 140 24 L 140 90 Z"
            fill="url(#pvcCornerGrad)"
          />
        </svg>

        {/* ========================================================
            CARD SIDE 1: MEMBER ID & TURNSTILE QR CARD (Main View)
            ======================================================== */}
        {cardSide === 'back' && (
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
            {/* Left Column: Member Identity & Dates (56% width) */}
            <div style={{ flex: '1.25', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Member Name */}
              <div
                className="pvc-text-primary"
                style={{
                  fontSize: 19,
                  fontWeight: 900,
                  letterSpacing: '0.4px',
                  lineHeight: 1.15,
                  wordBreak: 'break-word',
                }}
              >
                {memberName}
              </div>

              {/* Status Badge */}
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: '#ea580c',
                  letterSpacing: '1.4px',
                  textTransform: 'uppercase',
                  marginTop: 2,
                  marginBottom: 14,
                }}
              >
                {membershipTitle}
              </div>

              {/* Row 1: Membership ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="pvc-badge-circle"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CardIcons.User size={13} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    MEMBERSHIP ID
                  </div>
                  <div className="pvc-text-primary" style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }}>
                    {memberCode}
                  </div>
                </div>
              </div>

              {/* Divider 1 */}
              <div className="pvc-divider-line" style={{ height: 1, margin: '6px 0 6px 38px' }} />

              {/* Row 2: Joining Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="pvc-badge-circle"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CardIcons.Calendar size={13} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    JOINING DATE
                  </div>
                  <div className="pvc-text-primary" style={{ fontSize: 12.5, fontWeight: 800 }}>
                    {joiningDateFormatted}
                  </div>
                </div>
              </div>

              {/* Divider 2 */}
              <div className="pvc-divider-line" style={{ height: 1, margin: '6px 0 6px 38px' }} />

              {/* Row 3: Valid Thru (1-Year Expiration) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="pvc-badge-circle"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CardIcons.Clock size={13} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    VALID THRU
                  </div>
                  <div className="pvc-text-primary" style={{ fontSize: 12.5, fontWeight: 800 }}>
                    {validThruFormatted}
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Dividing Line */}
            <div
              style={{
                width: 1.5,
                height: '80%',
                background: 'linear-gradient(180deg, rgba(234, 88, 12, 0.15) 0%, #ea580c 25%, #ea580c 75%, rgba(234, 88, 12, 0.15) 100%)',
                margin: '0 16px',
                flexShrink: 0,
              }}
            />

            {/* Right Column: Gym Brand & Turnstile QR Code (44% width) */}
            <div
              style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 12,
              }}
            >
              {/* Gym Logo Lockup (Crisp, No Shadow) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {/* Dumbbell Icon */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'none',
                    }}
                  >
                    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12" />
                    </svg>
                  </div>

                  <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1 }}>
                    <span className="pvc-text-primary">TIGAT</span>{' '}
                    <span style={{ color: '#ff7a00' }}>GYM</span>
                  </div>
                </div>

                {/* Gym Tagline */}
                <div className="pvc-text-muted" style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.4px', marginTop: 3 }}>
                  — Build Your Best Self —
                </div>
              </div>

              {/* QR Code with Orange Border & Scan Text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    border: '2px solid #ea580c',
                    borderRadius: 10,
                    padding: 4,
                    background: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'none',
                  }}
                  title="Official Turnstile Access QR Code"
                >
                  <QRCodeDisplay value={qrToken} size={84} bare />
                </div>

                <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div className="pvc-text-primary" style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    SCAN TO
                  </div>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: '#ea580c', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    CONNECT
                  </div>
                  <div style={{ fontSize: 7.5, color: '#94a3b8', marginTop: 2 }}>
                    Turnstile
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            CARD SIDE 2: FRONT BRAND COVER (Emblem Showcase)
            ======================================================== */}
        {cardSide === 'front' && (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {/* Dumbbell Crest */}
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none',
                marginBottom: 10,
              }}
            >
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12" />
              </svg>
            </div>

            {/* Brand Title */}
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.1 }}>
              <span className="pvc-text-primary">TIGAT</span>{' '}
              <span style={{ color: '#ff7a00' }}>GYM</span>
            </div>

            {/* Tagline */}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', letterSpacing: '1px', marginTop: 6 }}>
              — Build Your Best Self —
            </div>

            <div className="pvc-text-muted" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', marginTop: 4 }}>
              OFFICIAL MEMBERSHIP ACCESS
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                padding: '8px 16px',
              }}
            >
              <CardIcons.Printer size={15} />
              <span>Print Permanent Card</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleEmailCard}
              disabled={isSendingEmail}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                padding: '8px 14px',
              }}
            >
              <CardIcons.Mail size={15} />
              <span>{isSendingEmail ? 'Sending...' : 'Email Card'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCardSide(cardSide === 'back' ? 'front' : 'back')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                padding: '8px 14px',
              }}
            >
              <CardIcons.Rotate size={14} />
              <span>Flip Card Side</span>
            </button>
          </div>

          {emailStatus && (
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: emailStatus.success ? '#16a34a' : '#dc2626',
                background: emailStatus.success ? '#f0fdf4' : '#fef2f2',
                padding: '4px 12px',
                borderRadius: 6,
                border: `1px solid ${emailStatus.success ? '#bbf7d0' : '#fecaca'}`,
                textAlign: 'center',
              }}
            >
              {emailStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
