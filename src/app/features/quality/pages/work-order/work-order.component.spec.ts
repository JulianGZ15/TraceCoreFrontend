import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { WorkOrderComponent } from './work-order.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('WorkOrderComponent · pages', () => {
  it('espera a la recarga del padre antes de permitir iniciar mantenimiento', async () => {
    const setup = qualityTestProviders();
    setup.session.context.update((c) => ({
      ...c,
      companyPermissions: ['QUALITY_READ', 'MAINTENANCE_MANAGE'],
    }));
    await TestBed.configureTestingModule({
      imports: [WorkOrderComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrderComponent),
      c = fixture.componentInstance;
    c.asset.set(testAsset);
    c.record.set({
      uuid: 'order',
      version: 1,
      assetUuid: testAsset.uuid,
      kind: 'PREVENTIVE',
      reason: 'Planificado',
      scheduledAt: '2026-01-01T00:00:00Z',
      responsibleUuid: 'actor',
      workshopUuid: null,
      providerUuid: null,
      state: 'PLANNED',
      startedAt: null,
      completedAt: null,
      evidenceUuid: null,
      completionReason: null,
    });
    c.tasks.set([
      {
        uuid: 'task',
        version: 1,
        orderUuid: 'order',
        code: 'TASK',
        description: 'Tarea',
        requirements: 'Procedimiento',
        completedAt: null,
        evidenceUuid: null,
        completionReason: null,
      },
    ]);
    c.busy.set(true);
    fixture.detectChanges();
    const start = () =>
      Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Iniciar orden'),
      )!;
    expect(start().disabled).toBe(true);
    c.busy.set(false);
    fixture.detectChanges();
    expect(start().disabled).toBe(false);
    fixture.destroy();
  });
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [WorkOrderComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
