export type FilterValues = Record<string, string>;

export interface FilterRangeDef {
  from: string;
  to: string;
}

export interface FilterDef {
  key: string;
  label: string;
  group?: string;
  kind?: 'primary' | 'context' | 'filter';
  format?: (value: string) => string;
  resolve?: (value: string) => Promise<string>;
  range?: FilterRangeDef;
}

export interface FilterChip {
  key: string;
  keys: string[];
  label: string;
  value: string;
  title?: string;
  loading?: boolean;
}

export function activeCount(defs: FilterDef[], values: FilterValues): number {
  const seenRanges = new Set<string>();
  let count = 0;

  for (const def of defs) {
    if (def.kind === 'primary' || def.kind === 'context') continue;

    if (def.range) {
      const rangeId = `${def.range.from}:${def.range.to}`;
      if (seenRanges.has(rangeId)) continue;
      seenRanges.add(rangeId);
      const fromVal = values[def.range.from];
      const toVal = values[def.range.to];
      if (fromVal || toVal) count++;
      continue;
    }

    const val = values[def.key];
    if (val !== undefined && val !== null && val !== '') {
      count++;
    }
  }

  return count;
}

export function chipsFor(
  defs: FilterDef[],
  values: FilterValues,
  resolvedLabels?: Map<string, string>,
): FilterChip[] {
  const chips: FilterChip[] = [];
  const seenRanges = new Set<string>();

  for (const def of defs) {
    // Primary and context do not display as standard filter chips under the bar
    if (def.kind === 'primary' || def.kind === 'context') continue;

    if (def.range) {
      const rangeId = `${def.range.from}:${def.range.to}`;
      if (seenRanges.has(rangeId)) continue;
      seenRanges.add(rangeId);

      const fromVal = values[def.range.from];
      const toVal = values[def.range.to];
      if (!fromVal && !toVal) continue;

      let displayValue = '';
      if (fromVal && toVal) displayValue = `${fromVal} a ${toVal}`;
      else if (fromVal) displayValue = `Desde ${fromVal}`;
      else displayValue = `Hasta ${toVal}`;

      chips.push({
        key: def.key,
        keys: [def.range.from, def.range.to],
        label: def.label,
        value: displayValue,
        title: `${def.label}: ${displayValue}`,
      });
      continue;
    }

    const val = values[def.key];
    if (val === undefined || val === null || val === '') continue;

    let displayValue = val;
    if (resolvedLabels?.has(val)) {
      displayValue = resolvedLabels.get(val)!;
    } else if (def.format) {
      displayValue = def.format(val);
    }

    chips.push({
      key: def.key,
      keys: [def.key],
      label: def.label,
      value: displayValue,
      title: `${def.label}: ${displayValue}`,
    });
  }

  return chips;
}

export function patchFor(
  defs: FilterDef[],
  draft: FilterValues,
  current?: FilterValues,
): Record<string, string | null> {
  const patch: Record<string, string | null> = { offset: '0' };

  for (const def of defs) {
    if (def.range) {
      const fromVal = draft[def.range.from];
      const toVal = draft[def.range.to];
      patch[def.range.from] = fromVal ? fromVal.trim() : null;
      patch[def.range.to] = toVal ? toVal.trim() : null;
      continue;
    }

    const val = draft[def.key];
    patch[def.key] = val !== undefined && val !== null && val.trim() !== '' ? val.trim() : null;
  }

  // Preserve context if present in current but not explicitly in draft
  if (current) {
    for (const def of defs) {
      if (def.kind === 'context' && patch[def.key] === null && current[def.key]) {
        patch[def.key] = current[def.key];
      }
    }
  }

  return patch;
}

export function clearPatch(defs: FilterDef[]): Record<string, string | null> {
  const patch: Record<string, string | null> = { offset: '0' };

  for (const def of defs) {
    if (def.kind === 'context') continue; // Context is not cleared

    if (def.range) {
      patch[def.range.from] = null;
      patch[def.range.to] = null;
      continue;
    }

    patch[def.key] = null;
  }

  return patch;
}

export function readValues(
  defs: FilterDef[],
  paramMap: { get: (key: string) => string | null },
): FilterValues {
  const values: FilterValues = {};

  for (const def of defs) {
    if (def.range) {
      values[def.range.from] = paramMap.get(def.range.from) ?? '';
      values[def.range.to] = paramMap.get(def.range.to) ?? '';
      continue;
    }

    values[def.key] = paramMap.get(def.key) ?? '';
  }

  return values;
}
