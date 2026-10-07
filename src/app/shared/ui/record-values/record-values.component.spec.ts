import { recordFields } from './record-values.component';
describe('read-only record precision', () => {
  it('keeps exact decimals and excludes private metadata', () => {
    expect(
      recordFields({
        amount: 999,
        amountExact: '99999999999999.99999999',
        storageKey: 'private',
        fingerprint: 'private',
      }),
    ).toEqual([{ label: 'Importe', value: '99999999999999.99999999' }]);
  });
  it('does not substitute rounded or missing values', () => {
    expect(recordFields({ value: 1 })[0].value).toContain('incompatible');
    expect(recordFields({ value: null, valueExact: null })[0].value).toBe('Sin dato');
  });
});

it('consume campos exactos nuevos sin caer al número redondeado', () => {
  expect(recordFields({ remainingTax: 0.1, remainingTaxExact: '0.10000000' })[0].value).toBe(
    '0.10000000',
  );
  expect(
    recordFields({ customDecimal: 10, customDecimalExact: '999999999999.999999' })[0].value,
  ).toBe('999999999999.999999');
});
