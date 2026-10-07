import { describe, it, expect } from 'vitest';
import { ReceiptsComponent } from './receipts.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('support/pages/receipts/receipts', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(ReceiptsComponent);
    expect(api.get).toHaveBeenCalledWith(
      '/queries/support/rfid-receipts',
      expect.objectContaining({ offset: 0 }),
      expect.anything(),
    );
    expect(fixture.nativeElement.textContent).toContain('Recibos RFID');
  });
});
