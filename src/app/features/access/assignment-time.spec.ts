import { Assignment } from '../../core/http/api';
import { assignmentState, toInstant } from './assignment-time';
describe('Assignment instants', () => {
  const a = {
    validFrom: '2026-10-03T12:00:00Z',
    validTo: '2026-10-03T13:00:00Z',
    revokedAt: null,
  } as Assignment;
  it('uses an inclusive start and exclusive end', () => {
    expect(assignmentState(a, Date.parse(a.validFrom) - 1)).toBe('Futura');
    expect(assignmentState(a, Date.parse(a.validFrom))).toBe('Vigente');
    expect(assignmentState(a, Date.parse(a.validTo!))).toBe('Vencida');
  });
  it('prioritizes revocation', () => {
    expect(assignmentState({ ...a, revokedAt: a.validFrom }, 0)).toBe('Revocada');
  });
  it('converts explicit offsets to UTC', () => {
    expect(toInstant('2026-10-03T09:30', '-06:00')).toBe('2026-10-03T15:30:00.000Z');
    expect(toInstant('', '+00:00')).toBeNull();
  });
  it.each([
    ['2026-02-30T12:00', '+00:00'],
    ['2026-10-03T24:00', '+00:00'],
    ['2026-10-03T12:00', '+14:30'],
    ['2026-10-03T12:00', 'UTC'],
  ])('rejects invalid date/zone %s %s', (date, zone) => {
    expect(() => toInstant(date, zone)).toThrow();
  });
});
