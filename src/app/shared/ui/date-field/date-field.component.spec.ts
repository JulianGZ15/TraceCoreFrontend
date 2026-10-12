import { describe, expect, it } from 'vitest';
import { isoToLocalDateTime } from './date-field.component';

describe('date field time-zone conversion', () => {
  it('shows ISO instants in the requested zone', () => {
    expect(isoToLocalDateTime('2026-10-12T18:30:00.000Z', 'America/Mexico_City')).toBe(
      '2026-10-12T12:30',
    );
  });
});
