import { describe, it, expect } from 'vitest';
import { validPending, PendingDocument } from './pending';
import { ids } from './testing';
describe('Solicitudes documentales persistidas', () => {
  it('rechaza rutas externas, operaciones ajenas y UUID diferentes', () => {
    const p: PendingDocument = {
      actor: ids.actor,
      key: ids.document,
      operation: 'CREATE',
      path: '/documents',
      payload: { uuid: ids.document },
    };
    expect(validPending(p)).toBe(true);
    expect(validPending({ ...p, path: 'https://outside.test' })).toBe(false);
    expect(validPending({ ...p, payload: { uuid: ids.file } })).toBe(false);
    expect(
      validPending({
        ...p,
        operation: 'LINK',
        path: '/documents/links',
        payload: { uuid: ids.document, subjectKind: 'ANY', subjectUuid: ids.owner },
      }),
    ).toBe(false);
  });
  it('un upload guarda metadatos verificados, nunca el archivo', () => {
    expect(
      validPending({
        actor: ids.actor,
        key: ids.file,
        operation: 'UPLOAD',
        path: '/documents/' + ids.document + '/versions',
        payload: { versionUuid: ids.file, documentVersion: 0 },
        filename: 'source.pdf',
        size: 10,
        sha256: 'a'.repeat(64),
      }),
    ).toBe(true);
  });
});
