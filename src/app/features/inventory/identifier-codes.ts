import * as bwipjs from 'bwip-js/browser';
import { BarcodeFormat, EncodeHintType, QRCodeWriter } from '@zxing/library';

function qrSvg(matrix: { getWidth(): number; getHeight(): number; get(x: number, y: number): boolean }, quiet: number, logoDataUrl?: string) {
  const width = matrix.getWidth();
  const height = matrix.getHeight();
  const modules: string[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix.get(x, y)) modules.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
    }
  }
  const size = Math.max(width, height) + quiet * 2;
  const centerLogo = logoDataUrl && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logoDataUrl)
    ? `<rect x="${size * 0.375}" y="${size * 0.375}" width="${size * 0.25}" height="${size * 0.25}" rx="${size * 0.025}" fill="#fff"/><image href="${logoDataUrl}" x="${size * 0.405}" y="${size * 0.405}" width="${size * 0.19}" height="${size * 0.19}" preserveAspectRatio="xMidYMid meet"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h${size}v${size}H0z"/><path fill="#000" d="${modules.join('')}"/>${centerLogo}</svg>`;
}

export function createIdentifierCodes(value: string, logoDataUrl?: string) {
  const hints = new Map<EncodeHintType, unknown>();
  hints.set(EncodeHintType.ERROR_CORRECTION, 'H');
  const qr = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 0, 0, hints);
  const qrSource = qrSvg(qr, 4, logoDataUrl);
  const barcodeSource = bwipjs.toSVG({ bcid: 'code128', text: value, scale: 3, height: 20, includetext: true, textsize: 13, textyoffset: 4, paddingwidth: 12, paddingheight: 8, backgroundcolor: 'FFFFFF', barcolor: '000000' });
  return {
    qr: URL.createObjectURL(new Blob([qrSource], { type: 'image/svg+xml' })),
    barcode: URL.createObjectURL(new Blob([barcodeSource], { type: 'image/svg+xml' })),
  };
}
