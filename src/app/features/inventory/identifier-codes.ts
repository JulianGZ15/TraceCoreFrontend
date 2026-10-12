import * as bwipjs from 'bwip-js/browser';
import { BarcodeFormat, EncodeHintType, QRCodeWriter } from '@zxing/library';

function png(matrix: { getWidth(): number; getHeight(): number; get(x: number, y: number): boolean }, scale: number, quiet: number) {
  const canvas = document.createElement('canvas');
  const width = matrix.getWidth(), height = matrix.getHeight();
  canvas.width = (width + quiet * 2) * scale;
  canvas.height = (height + quiet * 2) * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo crear la imagen del código.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#111';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix.get(x, y)) context.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
    }
  }
  return canvas.toDataURL('image/png');
}

export function createIdentifierCodes(uuid: string, url: string) {
  const qr = new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 180, 180, new Map<EncodeHintType, unknown>());
  const barcode = document.createElement('canvas');
  bwipjs.toCanvas(barcode, { bcid: 'code128', text: uuid, scale: 3, height: 18, includetext: false, padding: 10, backgroundcolor: 'FFFFFF' });
  return { qr: png(qr, 4, 4), barcode: barcode.toDataURL('image/png') };
}
