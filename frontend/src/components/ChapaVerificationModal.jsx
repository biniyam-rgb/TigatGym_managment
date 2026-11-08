import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import BrandLogo from './BrandLogo';

export default function ChapaVerificationModal({
  isOpen,
  onClose,
  merchantReference,
  onVerified,
}) {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed' | 'pending'
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  const verifyPayment = useCallback(async (ref) => {
    if (!ref) return;

    setStatus('verifying');
    setIsRetrying(true);
    setErrorMessage('');

    try {
      const res = await apiClient.verifyChapa({ merchant_reference: ref });

      if (res.status === 'success' && res.data?.is_paid) {
        setStatus('success');
        setResultData(res.data);
        if (onVerified) {
          onVerified(res.data);
        }
      } else if (res.status === 'pending' || res.data?.status === 'pending') {
        setStatus('pending');
        setResultData(res.data);
        setErrorMessage(res.message || 'Payment is still being processed by Chapa or awaiting authorization.');
      } else {
        setStatus('failed');
        setResultData(res.data || null);
        setErrorMessage(res.message || 'Payment was unsuccessful or cancelled.');
      }
    } catch (err) {
      console.error('Chapa verification error:', err);
      setStatus('failed');
      const msg = err.response?.data?.message || err.message || 'Unable to verify payment with Chapa payment gateway.';
      setErrorMessage(msg);
    } finally {
      setIsRetrying(false);
    }
  }, [onVerified]);

  useEffect(() => {
    if (isOpen && merchantReference) {
      const timer = setTimeout(() => {
        verifyPayment(merchantReference);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, merchantReference, verifyPayment]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'linear-gradient(145deg, #0d131f 0%, #151d2d 100%)',
          border: '1.5px solid rgba(230, 124, 0, 0.35)',
          borderRadius: 18,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(230, 124, 0, 0.12)',
          padding: '28px 24px',
          color: '#f8fafc',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header with Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandLogo size={32} showSubtext={false} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', color: '#E67C00', textTransform: 'uppercase' }}>
                Tigat Gym • Payment Verification
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Chapa API v2 Hosted Checkout</div>
            </div>
          </div>
          {status !== 'verifying' && (
            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content based on status */}
        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 18px',
                borderRadius: '50%',
                border: '3px solid rgba(230, 124, 0, 0.2)',
                borderTopColor: '#E67C00',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>
              {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
              Verifying Payment with Chapa...
            </h3>
            <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Connecting to Chapa v2 Gateway to confirm transaction status and authorize membership activation.
            </p>
            {merchantReference && (
              <div
                style={{
                  marginTop: 18,
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 8,
                  display: 'inline-block',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: '#cbd5e1',
                }}
              >
                Ref: {merchantReference}
              </div>
            )}
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                color: '#10b981',
                fontSize: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>
              Payment Confirmed & Membership Activated!
            </h3>
            <p style={{ fontSize: 12.5, color: '#10b981', fontWeight: 600, margin: '0 0 20px' }}>
              Subscription is now active. Member pass is authorized for QR check-in.
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px 18px',
                textAlign: 'left',
                marginBottom: 22,
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Merchant Reference</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>
                  {resultData?.merchant_reference || merchantReference}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Amount Paid</span>
                <span style={{ fontWeight: 800, color: '#E67C00', fontSize: 13 }}>
                  {Number(resultData?.amount || 0).toLocaleString()} {resultData?.currency || 'ETB'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Subscription Status</span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Active
                </span>
              </div>
              {resultData?.start_date && resultData?.end_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Valid Period</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                    {resultData.start_date} → {resultData.end_date}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #E67C00 0%, #d97706 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(230, 124, 0, 0.35)',
              }}
            >
              Continue to Dashboard
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                color: '#ef4444',
                fontSize: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              ✕
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>
              Payment Incomplete or Cancelled
            </h3>
            <p style={{ fontSize: 12.5, color: '#fca5a5', margin: '0 0 20px', lineHeight: 1.5 }}>
              {errorMessage || 'The payment transaction could not be confirmed with Chapa. No membership was activated.'}
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => verifyPayment(merchantReference)}
                disabled={isRetrying}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#E67C00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                  opacity: isRetrying ? 0.7 : 1,
                }}
              >
                {isRetrying ? 'Re-Checking...' : 'Retry Verification'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '2px solid #eab308',
                color: '#eab308',
                fontSize: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              ⏳
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>
              Payment Still Pending
            </h3>
            <p style={{ fontSize: 12.5, color: '#fde047', margin: '0 0 20px', lineHeight: 1.5 }}>
              {errorMessage || 'The payment session has not been completed yet on Chapa.'}
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => verifyPayment(merchantReference)}
                disabled={isRetrying}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#E67C00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                }}
              >
                {isRetrying ? 'Checking...' : 'Check Again'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Wait & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
