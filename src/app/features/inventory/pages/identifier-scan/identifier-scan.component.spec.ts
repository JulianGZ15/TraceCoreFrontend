import { describe, expect, it } from 'vitest';
import { assetPathFromCode } from './identifier-scan.component';

describe('assetPathFromCode', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';
  it('resolves a Code 128 UUID to the protected equipment dossier', () => {
    expect(assetPathFromCode(uuid, 'https://tracecore.example')).toBe(`/equipos/${uuid}/general`);
  });
  it('accepts only same-origin QR links to an equipment dossier', () => {
    expect(assetPathFromCode(`https://tracecore.example/equipos/${uuid}/general`, 'https://tracecore.example')).toBe(`/equipos/${uuid}/general`);
    expect(assetPathFromCode(`https://other.example/equipos/${uuid}/general`, 'https://tracecore.example')).toBeNull();
  });
  it('rejects malformed or unrelated codes', () => {
    expect(assetPathFromCode('not-an-asset', 'https://tracecore.example')).toBeNull();
    expect(assetPathFromCode('https://tracecore.example/login', 'https://tracecore.example')).toBeNull();
  });
});
