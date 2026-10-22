export interface PhotoActor { uuid: string; name: string }
export interface PhotoCapture {
  takenAtLocal: string | null; offsetMinutes: number | null;
  source: 'EXIF' | 'MANUAL' | 'UNKNOWN'; exifTakenAtLocal: string | null;
  exifOffsetMinutes: number | null; cameraMake: string | null;
  cameraModel: string | null; originalOrientation: number | null;
}
export interface PhotoImage { mediaType: string; size: number; width: number; height: number; sha256: string }
export interface EquipmentPhoto {
  uuid: string; assetUuid: string; description: string | null; state: 'ACTIVE' | 'ARCHIVED';
  uploadedBy: PhotoActor; uploadedAt: string; uploadChannel: string;
  original: PhotoImage & { filename: string }; capture: PhotoCapture;
  images: Record<string, PhotoImage>; archivedBy: PhotoActor | null;
  archivedAt: string | null; archiveReason: string | null; version: number;
}
export interface PhotoEvent {
  uuid: string; action: string; actor: PhotoActor; occurredAt: string; reason: string | null;
  before: EquipmentPhoto | null; after: EquipmentPhoto;
}
export interface PhotoPage<T> { items: T[]; offset: number; limit: number; hasMore: boolean; nextOffset: number | null }
export function offsetText(value: number | null): string {
  if (value == null) return '';
  return (value < 0 ? '-' : '+') + String(Math.floor(Math.abs(value) / 60)).padStart(2, '0') + ':' + String(Math.abs(value) % 60).padStart(2, '0');
}
export function offsetMinutes(value: string): number | null {
  if (!value.trim()) return null;
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(value);
  if (!match || +match[2] > 18 || +match[3] > 59 || (+match[2] === 18 && +match[3] !== 0)) throw new Error('Indica una zona como -06:00 o deja el campo vacío.');
  return (match[1] === '-' ? -1 : 1) * (+match[2] * 60 + +match[3]);
}
export function takenText(photo: EquipmentPhoto): string {
  const c = photo.capture;
  if (!c.takenAtLocal) return 'Fecha de toma desconocida';
  return c.takenAtLocal.replace('T', ' ') + ' · ' + (c.source === 'EXIF' ? 'EXIF' : 'Declarada') + ' · ' +
    (c.offsetMinutes == null ? 'Zona no informada' : 'UTC' + offsetText(c.offsetMinutes));
}
export function photoOffsetValidator(control: { value: unknown }): { offset: true } | null {
  try { offsetMinutes(typeof control.value === 'string' ? control.value : ''); return null; }
  catch { return { offset: true }; }
}
