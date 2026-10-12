function partsFor(value: string, timeZone: string): Record<string, string> {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Fecha y hora inválidas.');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
}

export function isoToLocalDateTime(value: string, timeZone: string): string {
  if (!value) return '';
  const parts = partsFor(value, timeZone);
  return `${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}`;
}

export function localDateTimeToIso(value: string, timeZone: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new RangeError('Indica una fecha y hora válidas.');
  const expected = match.slice(1).map(Number);
  const [year, month, day, hour, minute] = expected;
  const wallTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const utcParts = (stamp: number) => {
    const d = new Date(stamp);
    return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
  };
  if (utcParts(wallTimeAsUtc).some((part, index) => part !== expected[index])) {
    throw new RangeError('La fecha y hora no existen.');
  }

  // Resolve a local wall time using the selected IANA zone without relying on
  // the browser machine's time zone. A repeated time resolves to its earlier occurrence.
  let candidate = wallTimeAsUtc;
  for (let attempt = 0; attempt < 4; attempt++) {
    const actual = partsFor(new Date(candidate).toISOString(), timeZone);
    const actualParts = [
      Number(actual['year']),
      Number(actual['month']),
      Number(actual['day']),
      Number(actual['hour']),
      Number(actual['minute']),
    ];
    const actualAsUtc = Date.UTC(
      actualParts[0], actualParts[1] - 1, actualParts[2], actualParts[3], actualParts[4],
    );
    const correction = wallTimeAsUtc - actualAsUtc;
    if (!correction) return formatWithZoneOffset(value, candidate);
    candidate += correction;
  }
  const resolved = partsFor(new Date(candidate).toISOString(), timeZone);
  if (
    `${resolved['year']}-${resolved['month']}-${resolved['day']}T${resolved['hour']}:${resolved['minute']}` !== value
  ) {
    throw new RangeError('La hora seleccionada no existe en la zona horaria indicada.');
  }
  return formatWithZoneOffset(value, candidate);
}

function formatWithZoneOffset(localValue: string, instant: number): string {
  const [date, time] = localValue.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wallTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMinutes = (wallTimeAsUtc - instant) / 60_000;
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, '0')}:${String(absoluteOffset % 60).padStart(2, '0')}`;
  return `${localValue}:00${offset}`;
}
