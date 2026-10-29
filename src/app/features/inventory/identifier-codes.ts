import * as bwipjs from 'bwip-js/browser';
import { BarcodeFormat, EncodeHintType, QRCodeWriter } from '@zxing/library';

function qrSvg(matrix: { getWidth(): number; getHeight(): number; get(x: number, y: number): boolean }, quiet: number) {
  const width = matrix.getWidth();
  const height = matrix.getHeight();
  const modules: string[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix.get(x, y)) modules.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
    }
  }
  const size = Math.max(width, height) + quiet * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h${size}v${size}H0z"/><path fill="#000" d="${modules.join('')}"/></svg>`;
}

export function createIdentifierCodes(uuid: string, url: string) {
  const qr = new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 0, 0, new Map<EncodeHintType, unknown>());
  const qrSource = qrSvg(qr, 4);
  const barcodeSource = bwipjs.toSVG({ bcid: 'code128', text: uuid, scale: 3, height: 18, includetext: false, padding: 10, backgroundcolor: 'FFFFFF', barcolor: '000000' });
  return {
    qr: URL.createObjectURL(new Blob([qrSource], { type: 'image/svg+xml' })),
    barcode: URL.createObjectURL(new Blob([barcodeSource], { type: 'image/svg+xml' })),
  };
}
