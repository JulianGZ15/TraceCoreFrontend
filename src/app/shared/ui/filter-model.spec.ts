import {
  activeCount,
  chipsFor,
  patchFor,
  clearPatch,
  readValues,
  FilterDef,
} from './filter-model';

describe('filter-model utilities', () => {
  const defs: FilterDef[] = [
    { key: 'search', label: 'Búsqueda', kind: 'primary' },
    { key: 'yardUuid', label: 'Patio', kind: 'context' },
    { key: 'role', label: 'Rol', format: (v) => `Rol-${v}` },
    { key: 'active', label: 'Estado', format: (v) => (v === 'true' ? 'Activo' : 'Inactivo') },
    {
      key: 'dates',
      label: 'Fecha',
      range: { from: 'from', to: 'to' },
    },
  ];

  it('activeCount should ignore primary and context and count active filters', () => {
    const values = {
      search: 'algo',
      yardUuid: 'yard-1',
      role: 'SUPPLIER',
      active: 'true',
      from: '2026-01-01',
      to: '2026-01-02',
    };
    // role (1) + active (1) + dates range (1) = 3
    expect(activeCount(defs, values)).toBe(3);
  });

  it('chipsFor should generate chips excluding primary and context', () => {
    const values = {
      search: 'algo',
      yardUuid: 'yard-1',
      role: 'SUPPLIER',
      active: 'true',
    };
    const chips = chipsFor(defs, values);
    expect(chips.length).toBe(2);
    expect(chips[0].label).toBe('Rol');
    expect(chips[0].value).toBe('Rol-SUPPLIER');
    expect(chips[1].label).toBe('Estado');
    expect(chips[1].value).toBe('Activo');
  });

  it('patchFor should reset offset to 0 and nullify empty fields', () => {
    const draft = {
      search: 'test',
      role: '',
      active: 'true',
    };
    const patch = patchFor(defs, draft, { yardUuid: 'yard-ctx' });
    expect(patch['offset']).toBe('0');
    expect(patch['search']).toBe('test');
    expect(patch['role']).toBeNull();
    expect(patch['active']).toBe('true');
    expect(patch['yardUuid']).toBe('yard-ctx');
  });

  it('clearPatch should clear filter keys while keeping context', () => {
    const patch = clearPatch(defs);
    expect(patch['offset']).toBe('0');
    expect(patch['search']).toBeNull();
    expect(patch['role']).toBeNull();
    expect(patch['active']).toBeNull();
    expect(patch['from']).toBeNull();
    expect(patch['to']).toBeNull();
    expect(patch['yardUuid']).toBeUndefined();
  });

  it('readValues should extract defined keys from paramMap', () => {
    const map = new Map<string, string>([
      ['search', 'test'],
      ['role', 'CUSTOMER'],
      ['from', '2026-01-01'],
    ]);
    const mockParamMap = { get: (k: string) => map.get(k) ?? null };
    const values = readValues(defs, mockParamMap);
    expect(values['search']).toBe('test');
    expect(values['role']).toBe('CUSTOMER');
    expect(values['from']).toBe('2026-01-01');
    expect(values['to']).toBe('');
  });
});
