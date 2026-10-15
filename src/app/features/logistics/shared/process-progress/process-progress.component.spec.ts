import { render } from '../../../../testing/component-test';
import { Summary } from '../../models';
import { ProcessProgressComponent } from './process-progress.component';

describe('ProcessProgressComponent', () => {
  function summary(state: string, trip: Summary['trip'] = null): Summary {
    return {
      manifest: { uuid: 'manifest', version: 1, yardUuid: 'yard', state, type: 'OUTBOUND' },
      trip,
      labels: {},
      rootCount: 2,
      pieceCount: 2,
      deliveredRootCount: 0,
      totalWeightKgExact: '20',
      unknownWeightRoots: 0,
      carrierUuid: null,
    };
  }

  it('moves the current stage back to verification after a failed check', async () => {
    const fixture = await render(ProcessProgressComponent, {
      summary: summary('DRAFT', { uuid: 'trip', version: 1, state: 'PLANNED' }),
    });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li.stepper-item');
    expect(items[1].textContent).toContain('Completado');
    expect(items[2].getAttribute('aria-current')).toBe('step');
    expect(items[3].textContent).toContain('Pendiente');
  });

  it('marks delivered manifests complete and cancelled manifests terminal', async () => {
    const delivered = await render(ProcessProgressComponent, { summary: summary('DELIVERED') });
    delivered.detectChanges();
    expect(delivered.nativeElement.querySelectorAll('li.completed')).toHaveLength(5);
    expect(delivered.nativeElement.querySelector('[aria-current="step"]')).toBeNull();

    const cancelledSummary = summary('CANCELLED');
    cancelledSummary.manifest['dispatchCheckUuid'] = 'check';
    const cancelled = await render(ProcessProgressComponent, { summary: cancelledSummary });
    cancelled.detectChanges();
    expect(cancelled.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Manifiesto cancelado',
    );
    expect(cancelled.nativeElement.querySelector('[aria-current="step"]')).toBeNull();
    expect(cancelled.nativeElement.querySelectorAll('li.completed')).toHaveLength(3);
  });
});
