import { displayInstant } from './instant';
describe('Instantes de consulta', () => {
  it('muestra zona de empresa conservando offset y precisión originales', () => {
    const v = '2026-10-06T10:00:00.123456789Z';
    expect(displayInstant(v, 'America/Mexico_City')).toContain('America/Mexico_City');
    expect(displayInstant(v, 'America/Mexico_City')).toContain(v);
    expect(displayInstant('2026-10-06', 'America/Mexico_City')).toBe('2026-10-06');
  });
});
