import { describe, it, expect } from 'vitest';
import { AuditComponent } from './audit.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('support/pages/audit/audit', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(AuditComponent);
    expect(api.get).toHaveBeenCalledWith(
      '/queries/support/audit',
      expect.objectContaining({ offset: 0 }),
      expect.anything(),
    );
    expect(fixture.nativeElement.textContent).toContain('Auditoría');
  });
});
