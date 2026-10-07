import { describe, it, expect } from 'vitest';
import { decisionAllowed, validateFile, linkState } from './rules';
import { testSummary, testVersion } from './testing';
import { Linked } from './models';
describe('Reglas documentales', () => {
  it('aprobar requiere último borrador, revocar no restaura versión anterior', () => {
    expect(decisionAllowed(testSummary, testVersion.metadata, 'APPROVE')).toBe(true);
    expect(decisionAllowed({ ...testSummary, latest: null }, testVersion.metadata, 'APPROVE')).toBe(
      false,
    );
    expect(
      decisionAllowed(
        { ...testSummary, document: { ...testSummary.document, state: 'ARCHIVED' } },
        testVersion.metadata,
        'REJECT',
      ),
    ).toBe(false);
  });
  it('acepta límite exacto y rechaza vacío/exceso/nombres con rutas', () => {
    expect(() => validateFile(new File([new Uint8Array(10485760)], 'ok.pdf'))).not.toThrow();
    expect(() => validateFile(new File([], 'ok.pdf'))).toThrow();
    expect(() => validateFile(new File([new Uint8Array(10485761)], 'ok.pdf'))).toThrow();
    expect(() => validateFile(new File(['x'], '../bad.pdf'))).toThrow();
  });
  it('compara vigencia mediante instantes, respetando offsets', () => {
    const row = {
      view: { effective: false, link: { validFrom: '2026-10-05T21:00:00-06:00', validTo: null } },
      evaluatedAt: '2026-10-06T02:00:00Z',
    } as Linked;
    expect(linkState(row)).toBe('Futuro');
  });
});
