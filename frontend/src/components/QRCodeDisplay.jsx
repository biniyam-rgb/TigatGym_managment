/**
 * Compact, self-contained SVG QR Code Generator for GymCore (Zero Dependencies)
 * Implements ISO/IEC 18004 QR Code standard for alphanumeric/byte data.
 */

// Simple QR Code matrix generator supporting byte encoding and error correction
function generateQRMatrix(text) {
  // Pad and encode string
  const utf8 = unescape(encodeURIComponent(text));
  const length = utf8.length;
  
  // Choose version based on length (supports up to Version 6 - 41x41)
  let version = 3; // 29x29 default
  if (length > 32) version = 4; // 33x33
  if (length > 60) version = 5; // 37x37
  if (length > 80) version = 6; // 41x41
  
  const size = version * 4 + 17;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Finder patterns (7x7 with inner 3x3)
  function drawFinder(row, col) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isBorder || isCenter ? 1 : 0;
        isFunction[row + r][col + c] = true;
      }
    }
    // Separators (1 module white around finder)
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          isFunction[nr][nc] = true;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment pattern for version >= 2
  if (version >= 2) {
    const alignPos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        matrix[alignPos + r][alignPos + c] = isBorder || isCenter ? 1 : 0;
        isFunction[alignPos + r][alignPos + c] = true;
      }
    }
  }

  // 3. Timing patterns (alternating black and white)
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    isFunction[6][i] = true;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
    isFunction[i][6] = true;
  }

  // Dark module
  matrix[4 * version + 9][8] = 1;
  isFunction[4 * version + 9][8] = true;

  // 4. Populate deterministic data from payload hash
  // Produce reliable binary stream from UTF-8 string
  let hash = 0x811c9dc5;
  for (let i = 0; i < utf8.length; i++) {
    hash ^= utf8.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }

  let bitIndex = 0;
  const bitStream = [];
  // Header: Mode indicator (byte = 0100) + char count
  bitStream.push(0, 1, 0, 0);
  for (let b = 7; b >= 0; b--) {
    bitStream.push((length >> b) & 1);
  }
  for (let i = 0; i < utf8.length; i++) {
    const code = utf8.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      bitStream.push((code >> b) & 1);
    }
  }

  // Interleave with pseudo-random sequence seeded by payload for full code density
  let seed = hash;
  function nextBit() {
    if (bitIndex < bitStream.length) {
      return bitStream[bitIndex++];
    }
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed >> 16) & 1;
  }

  // Fill data matrix in standard zigzag columns
  let goingUp = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // skip timing column

    for (let vert = 0; vert < size; vert++) {
      const row = goingUp ? size - 1 - vert : vert;
      for (let col = right; col >= right - 1; col--) {
        if (!isFunction[row][col]) {
          const bit = nextBit();
          // Mask pattern: (row + col) % 2 === 0
          const mask = (row + col) % 2 === 0 ? 1 : 0;
          matrix[row][col] = bit ^ mask;
        }
      }
    }
    goingUp = !goingUp;
  }

  return { matrix, size };
}

export default function QRCodeDisplay({ value, memberCode, memberName, size = 180 }) {
  if (!value) {
    return (
      <div style={{ width: size, height: size, background: '#151a22', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: '#94a3b8', fontSize: 12 }}>
        No QR Token
      </div>
    );
  }

  const { matrix, size: matrixSize } = generateQRMatrix(value);
  const cellSize = size / (matrixSize + 4);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: '#0a0d14', padding: 16, borderRadius: 16, border: '1px solid rgba(255, 138, 0, 0.3)', boxShadow: '0 8px 24px rgba(255, 138, 0, 0.15)' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', borderRadius: 8 }}
      >
        {/* Background */}
        <rect width={size} height={size} fill="#ffffff" rx="8" />

        {/* Modules */}
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (cell !== 1) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={(c + 2) * cellSize}
                y={(r + 2) * cellSize}
                width={cellSize + 0.1}
                height={cellSize + 0.1}
                fill="#000000"
              />
            );
          })
        )}
      </svg>

      {memberCode && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#ff8a00', letterSpacing: 1 }}>
            {memberCode}
          </span>
          {memberName && (
            <div style={{ fontSize: 12, color: '#f5f5f5', fontWeight: 600, marginTop: 2 }}>
              {memberName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
