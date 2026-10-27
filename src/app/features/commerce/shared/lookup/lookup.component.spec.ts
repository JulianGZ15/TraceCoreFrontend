import { LookupComponent } from './lookup.component';
import { renderOperation } from '../../../../testing/operation-test';
import { EntityLabelResolver } from '../../../../shared/ui/entity-label-resolver';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
describe('LookupComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(LookupComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).not.toContain('Anterior');
    expect(fixture.nativeElement.textContent).not.toContain('Siguiente');
    expect(fixture.nativeElement.textContent).not.toContain('Filas');
  });

  it('does not reload when params are recreated with the same values', async () => {
    const fixture = await renderOperation(LookupComponent, {});
    const lookup = fixture.componentInstance;
    vi.spyOn(lookup.api.session, 'valid').mockReturnValue(true);
    const get = vi.spyOn(lookup.api, 'get').mockResolvedValue([]);

    fixture.componentRef.setInput('yard', 'yard-uuid');
    fixture.componentRef.setInput('params', { purpose: 'CONTRACTOR' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(get).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('params', { purpose: 'CONTRACTOR' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('resolves a selected purchase order to its folio and counterparty', async () => {
    const fixture = await renderOperation(LookupComponent, {});
    const lookup = fixture.componentInstance;
    fixture.componentRef.setInput('resource', 'orders/directory');
    fixture.detectChanges();
    vi.spyOn(lookup.api, 'get').mockImplementation(async (path: string) => ({
      order: {
        uuid: 'order-1',
        version: 0,
        series: 'NASP',
        type: 'OC',
        folio: '3',
        partyUuid: 'party-1',
      },
    } as never));
    vi.spyOn(TestBed.inject(EntityLabelResolver), 'resolveParty').mockResolvedValue(
      'Proveedor Demo',
    );

    lookup.writeValue('order-1');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lookup.selectedLabel()).toBe('NASP-OC-3 · Proveedor Demo');
    fixture.destroy();
  });
});
