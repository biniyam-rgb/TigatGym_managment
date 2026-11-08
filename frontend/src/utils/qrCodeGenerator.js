import QRCode from 'qrcode';

/**
 * ISO/IEC 18004 Standard QR Code Matrix Generator
 * Powered by the official `qrcode` library.
 * Produces 100% standard-compliant QR codes recognized instantly by:
 * - Handheld hardware 2D barcode / laser scanners
 * - iOS and Android native camera apps
 * - Online / web-based QR scanners (ZXing, jsQR, Quagga, BarcodeDetector)
 * 
 * @param {string} text - Payload string to encode
 * @param {object} [options] - Configuration options
 * @returns {{ matrix: number[][], size: number }}
 */
export function generateValidQRMatrix(text, options = {}) {
  const payload = text && typeof text === 'string' && text.trim() ? text.trim() : 'TG-0001';
  const ecLevel = options.errorCorrectionLevel || 'M';

  try {
    const qr = QRCode.create(payload, { errorCorrectionLevel: ecLevel });
    const size = qr.modules.size;
    const matrix = [];

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(qr.modules.get(r, c) ? 1 : 0);
      }
      matrix.push(row);
    }

    return { matrix, size };
  } catch (err) {
    console.error('Failed to generate standard QR code matrix:', err);
    const fallback = QRCode.create('TG-0001', { errorCorrectionLevel: 'M' });
    const size = fallback.modules.size;
    const matrix = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(fallback.modules.get(r, c) ? 1 : 0);
      }
      matrix.push(row);
    }
    return { matrix, size };
  }
}

export default generateValidQRMatrix;
