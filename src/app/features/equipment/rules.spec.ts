import '@angular/compiler';
import { FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { safeReturn } from '../../core/auth/session';
import {
  approvalMissing,
  decimal,
  exact,
  readSpecs,
  scaled,
  specsForm,
  writeSpecs,
} from './rules';

const specs = {
  workingPressure: null,
  testPressure: null,
  bore: { valueExact: '999999999999.999999', unit: 'INCH' },
  wallThickness: null,
  length: null,
  width: null,
  height: null,
  weight: null,
  temperatureMinExact: '-273.150000',
  temperatureMaxExact: '10000.000000',
  temperatureUnit: 'CELSIUS',
  psl: null,
  pr: null,
} as const;

describe('reglas técnicas del catálogo', () => {
  it('valida magnitudes exactas sin convertirlas a Number', () => {
    expect(decimal('999999999999.999999')).toBe(true);
    expect(decimal('999999999999999.9999', 15, 4)).toBe(true);
    expect(scaled('999999999999.999999')).toBe(999999999999999999n);
    expect(decimal('1000000000000')).toBe(false);
    expect(decimal('1.0000001')).toBe(false);
    expect(decimal('1e6')).toBe(false);
    expect(() => exact(999999999999.99)).toThrow(/incompatible/i);
  });

  it('mantiene unidad y campos exactos al hidratar y escribir specs', () => {
    const form = specsForm();
    readSpecs(form, specs as never);
    expect(writeSpecs(form)['bore']).toEqual({ value: '999999999999.999999', unit: 'INCH' });
    expect(form.get('temperatureMin')?.value).toBe('-273.150000');
    expect(form.get('temperatureMax')?.value).toBe('10000.000000');
  });

  it('informa requisitos de aprobación por perfil y rechaza dimensiones mixtas', () => {
    const form = specsForm();
    expect(form.invalid).toBe(false);
    expect(approvalMissing(form, 'PRESSURE_EQUIPMENT')).toHaveLength(3);
    expect(approvalMissing(form, 'TUBULAR')).toEqual([
      'Diámetro / bore',
      'Espesor de pared',
      'Longitud',
    ]);
    (form.get('bore') as FormGroup).patchValue({ value: '1', unit: 'PSI' });
    expect(form.invalid).toBe(true);
  });

  it('valida acceso interno y no acepta rutas arbitrarias', () => {
    const id = '00000000-0000-0000-0000-000000000100';
    expect(safeReturn(`/equipos/${id}/uso?limit=25`)).toContain('/uso');
    expect(safeReturn(`/catalogo/modelos/${id}/fichas/nueva`)).toContain('/nueva');
    expect(safeReturn('/equipos/delete')).toBe('/inicio');
    expect(safeReturn('//evil.example/equipos')).toBe('/inicio');
  });
});
