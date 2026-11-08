import jsQR from 'jsqr';

/**
 * Standard ISO/IEC 18004 QR Code Decoder for Canvas & ImageData
 * Powered by jsQR with dual-inversion and high-tolerance detection.
 * Works universally on all desktop and mobile browsers, webcams, and uploaded images.
 * 
 * @param {ImageData} imageData - { data: Uint8ClampedArray, width: number, height: number }
 * @returns {string|null} Decoded string or null if no valid QR found
 */
export function decodeQRFromImageData(imageData) {
  if (!imageData || !imageData.data || imageData.width < 10 || imageData.height < 10) {
    return null;
  }

  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data && code.data.trim()) {
      return code.data.trim();
    }
  } catch (err) {
    console.error('jsQR decoding error:', err);
  }

  return null;
}

export default decodeQRFromImageData;
