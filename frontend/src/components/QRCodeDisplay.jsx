/**
 * ISO/IEC 18004 Standard QR Code Display for Tigat Gym
 * Uses the industry standard `qrcode` engine.
 * Guaranteed scannable by all standard 2D barcode scanner guns, smartphones, and webcams.
 */

import { generateValidQRMatrix } from '../utils/qrCodeGenerator';

export default function QRCodeDisplay({
  value,
  memberCode,
  memberName,
  size = 180,
  bare = false,
}) {
  if (!value) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: bare ? '#f8fafc' : '#151a22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        No QR Token
      </div>
    );
  }

  // Generate standard matrix
  const { matrix, size: matrixSize } = generateValidQRMatrix(value);
  // Standard quiet zone is 4 modules on all sides
  const quietZone = 4;
  const totalDim = matrixSize + quietZone * 2;

  // Build SVG path data for crisp, high-performance, single-element rendering
  let pathD = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        pathD += `M${c + quietZone} ${r + quietZone}h1v1h-1z `;
      }
    }
  }

  if (bare) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${totalDim} ${totalDim}`}
        style={{ display: 'block', borderRadius: 4 }}
        shapeRendering="crispEdges"
      >
        {/* Pure white quiet zone background */}
        <rect width={totalDim} height={totalDim} fill="#ffffff" />
        <path d={pathD} fill="#000000" />
      </svg>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff',
        padding: 14,
        borderRadius: 16,
        border: '1.5px solid #fed7aa',
        boxShadow: '0 4px 18px rgba(230, 124, 0, 0.12)',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${totalDim} ${totalDim}`}
        style={{ display: 'block' }}
        shapeRendering="crispEdges"
      >
        {/* Crisp White Quiet Zone */}
        <rect width={totalDim} height={totalDim} fill="#ffffff" />
        <path d={pathD} fill="#000000" />
      </svg>

      {memberCode && (
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              fontFamily: 'monospace',
              color: '#ea580c',
              letterSpacing: 1.2,
            }}
          >
            {memberCode}
          </span>
          {memberName && (
            <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700, marginTop: 2 }}>
              {memberName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
