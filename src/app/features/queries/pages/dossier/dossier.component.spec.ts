import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { DossierComponent } from './dossier.component';
import { renderWorkspace, ids, testSummary } from '../../../documents/testing';
describe('queries/pages/dossier/dossier', () => {
  it('respeta carga autorizada y validación previa', async () => {
    const { fixture, api } = await renderWorkspace(DossierComponent);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get.mock.calls.some((c) => c[0].includes('/sections/'))).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('instantánea');
  });

  it('mantiene la navegación del expediente y ofrece reintento si falla una sección', async () => {
    const { fixture, api } = await renderWorkspace(DossierComponent, {
      params: { uuid: ids.owner, seccion: 'calidad' },
    });
    api.get.mockResolvedValueOnce({
      profile: { uuid: ids.owner },
      sections: { technicalHistory: true, composition: true, contacts: true },
      generatedAt: '2026-10-26T00:00:00Z',
    } as never);
    api.get.mockRejectedValueOnce(new HttpErrorResponse({ status: 400 }));

    await fixture.componentInstance.load();
    fixture.detectChanges();

    expect(fixture.componentInstance.summary()).not.toBeNull();
    expect(fixture.componentInstance.section()).toBeNull();
    expect(fixture.nativeElement.querySelector('tc-page-nav')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('La navegación del expediente sigue disponible.');
    expect(fixture.nativeElement.textContent).toContain('Reintentar sección');
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar la información.');
    fixture.destroy();
  });
});
