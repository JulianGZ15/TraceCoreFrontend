import { exactAmount, validity, certificateState, reviews, toInstant } from './rules';
import { Certificate } from './models';
describe('Partner rules', () => {
  it('formats the maximum credit limit without rounding and rejects incompatible responses', () => {
    expect(exactAmount('999999999999999.9999')).toBe('999,999,999,999,999.9999');
    expect(() => exactAmount(1000 as unknown as string)).toThrow('backend');
    expect(() => exactAmount('1000000000000000')).toThrow();
  });
  it('uses half-open validity with revocation precedence', () => {
    const p = { validFrom: '2030-01-01T00:00:00Z', validTo: '2030-02-01T00:00:00Z' };
    expect(validity(p, Date.parse(p.validFrom))).toBe('Vigente');
    expect(validity(p, Date.parse(p.validTo))).toBe('Vencida');
    expect(validity({ ...p, revokedAt: p.validFrom }, 0)).toBe('Revocada');
  });
  it('keeps calendar expiry inclusive independently of verification', () => {
    const c = {
      issuedOn: '2030-01-01',
      expiresOn: '2030-02-01',
      verification: 'VERIFIED',
    } as Certificate;
    expect(certificateState(c, '2030-02-01')).toBe('Vigente');
    expect(certificateState(c, '2030-02-02')).toBe('Vencida');
    expect(certificateState({ ...c, verification: 'PENDING' }, '2030-01-02')).toBe('Vigente');
    expect(certificateState({ ...c, verification: 'REJECTED' }, '2030-02-02')).toBe('Vencida');
    expect(certificateState(c, '2029-12-31')).toBe('Emisión futura');
  });
  it('offers only backend-supported review transitions and uses explicit UTC offset', () => {
    expect(reviews('REVOKED')).toEqual([]);
    expect(reviews('VERIFIED')).toEqual(['REVOKED']);
    expect(toInstant('2030-01-01T12:00', '-06:00')).toBe('2030-01-01T18:00:00.000Z');
  });
});
