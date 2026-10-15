import { render } from '../../../../testing/component-test';
import { MovementDetail } from '../../models';
import { MovementProgressComponent } from './movement-progress.component';

describe('MovementProgressComponent', () => {
  function detail(state: string, type = 'OUTBOUND', logisticsManaged = false): MovementDetail {
    return {
      logisticsManaged,
      movement: {
        uuid: 'movement',
        version: 1,
        folio: 'MOV-1',
        type,
        state,
        sourceYardUuid: 'yard-a',
        sourceSiteUuid: null,
        destinationYardUuid: 'yard-b',
        destinationSiteUuid: null,
        reason: 'Prueba',
        sourceReference: 'REF-1',
        destinationCustodyMode: 'STORAGE',
        ownerAuthorizationReference: null,
        createdOn: '',
        dispatchedAt: null,
        receivedAt: null,
        authorizationReference: null,
        repairAuthorizationReference: null,
      },
      items: [],
    } as MovementDetail;
  }

  it('follows draft, transit and completion on standalone external movements', async () => {
    const inTransit = await render(MovementProgressComponent, { detail: detail('IN_TRANSIT') });
    inTransit.detectChanges();
    const items = inTransit.nativeElement.querySelectorAll('li.stepper-item');
    expect(items[0].textContent).toContain('Completado');
    expect(items[1].getAttribute('aria-current')).toBe('step');

    const completed = await render(MovementProgressComponent, { detail: detail('COMPLETED') });
    completed.detectChanges();
    expect(completed.nativeElement.querySelectorAll('li.completed')).toHaveLength(3);
  });

  it('omits direct-completion and logistics-managed movements', async () => {
    const direct = await render(MovementProgressComponent, {
      detail: detail('COMPLETED', 'ADJUSTMENT'),
    });
    direct.detectChanges();
    expect(direct.nativeElement.querySelector('tc-stepper')).toBeNull();

    const managed = await render(MovementProgressComponent, {
      detail: detail('IN_TRANSIT', 'OUTBOUND', true),
    });
    managed.detectChanges();
    expect(managed.nativeElement.querySelector('tc-stepper')).toBeNull();
  });
});
