/** Formats only offset-bearing instants. Calendar dates and original precision stay intact. */
export function displayInstant(value: unknown, zone = 'UTC'): string {
  if (typeof value !== 'string') return value == null ? 'Sin dato' : String(value);
  if (!/T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return value;
  try {
    return (
      new Intl.DateTimeFormat('es-MX', {
        timeZone: zone,
        dateStyle: 'medium',
        timeStyle: 'long',
        hourCycle: 'h23',
      }).format(new Date(value)) +
      ' · ' +
      zone +
      ' · ' +
      value
    );
  } catch {
    return value + ' · zona no disponible';
  }
}
