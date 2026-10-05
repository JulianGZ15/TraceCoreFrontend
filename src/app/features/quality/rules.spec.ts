import { describe, it, expect } from 'vitest';
import { signedDecimal, scaled, optionalExact, toInstant, decimalDisplay } from './rules';
import { safeReturn } from '../../core/auth/session';
describe('reglas de calidad', () => {
  it('distingue ausencia de límite de un backend sin representación exacta', () => {
    expect(decimalDisplay(null,null,'Sin límite')).toBe('Sin límite');
    expect(decimalDisplay(123,undefined,'Sin límite')).toContain('Backend incompatible');
    expect(decimalDisplay(123,'123.000001','Sin límite')).toBe('123.000001');
  });
  it('conserva límites positivos y negativos sin redondear', () => {
    for (const value of ['999999999999.999999', '-999999999999.999999', '0', '-0.000001'])
      expect(signedDecimal(value)).toBe(true);
    expect(scaled('999999999999.999999')).toBe(999999999999999999n);
    for (const value of ['1000000000000', '1.0000001', '1,25', '1e6', 2])
      expect(signedDecimal(value)).toBe(false);
  });
  it('bloquea valores numéricos sin representación exacta', () => {
    expect(() => optionalExact(123, null)).toThrow(/incompatible/);
    expect(optionalExact(null, null)).toBeNull();
    expect(optionalExact(123, '123.000001')).toBe('123.000001');
  });
  it('valida zona explícita, fechas y conserva fracciones de los instantes', () => {
    expect(toInstant('2026-10-05T10:00:59.123456789-06:00')).toBe('2026-10-05T16:00:59.123456789Z');
    expect(toInstant('2026-10-05T10:00Z')).toBe('2026-10-05T10:00:00Z');
    expect(() => toInstant('2026-02-30T10:00:00Z')).toThrow();
    expect(() => toInstant('2026-10-05T10:00')).toThrow();
  });
  it('acepta retornos internos del módulo y rechaza destinos arbitrarios', () => {
    expect(safeReturn('/calidad/equipos/00000000-0000-4000-8000-000000000001/mtr')).toContain(
      '/calidad',
    );
    expect(safeReturn('/calidad/politicas/nueva')).toBe('/calidad/politicas/nueva');
    expect(
      safeReturn('/calidad/inspecciones/00000000-0000-4000-8000-000000000001/resultados'),
    ).toContain('resultados');
    expect(safeReturn('//evil.example')).toBe('/inicio');
    expect(safeReturn('/calidad/equipos/x')).toBe('/inicio');
  });
});
