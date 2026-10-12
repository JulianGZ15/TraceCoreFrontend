import { describe, expect, it } from 'vitest';
import { isoToLocalDateTime, localDateTimeToIso } from './date-time';

describe('date field time-zone conversion', () => {
  it('shows ISO instants in the requested zone', () => {
    expect(isoToLocalDateTime('2026-10-12T18:30:00.000Z', 'America/Mexico_City')).toBe(
      '2026-10-12T12:30',
    );
  });

  it('serializes a local calendar selection with the zone offset and keeps the same instant', () => {
    const iso = localDateTimeToIso('2026-10-12T12:30', 'America/Mexico_City');
    expect(iso).toBe('2026-10-12T12:30:00-06:00');
    expect(Date.parse(iso)).toBe(Date.parse('2026-10-12T18:30:00.000Z'));
  });

  it('rejects a local time skipped by a daylight-saving transition', () => {
    expect(() => localDateTimeToIso('2026-03-08T02:30', 'America/Chicago')).toThrow(
      'La hora seleccionada no existe en la zona horaria indicada.',
    );
  });
});
