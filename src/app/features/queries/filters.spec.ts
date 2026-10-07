import { describe, it, expect } from 'vitest';
import { validateFilters } from './filters';
describe('Filtros de consultas', () => {
  it('conserva intervalos con zona, rechaza fechas locales e intervalos vacíos', () => {
    expect(() =>
      validateFilters({ from: '2026-10-06T00:00:00-06:00', to: '2026-10-07T00:00:00Z' }),
    ).not.toThrow();
    expect(() => validateFilters({ from: '2026-10-06T00:00:00' })).toThrow();
    expect(() =>
      validateFilters({ from: '2026-10-06T00:00:00Z', to: '2026-10-06T00:00:00Z' }),
    ).toThrow();
    expect(() => validateFilters({ assetUuid: 'external' })).toThrow();
  });
});
