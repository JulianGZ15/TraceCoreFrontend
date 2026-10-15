import { TestBed } from '@angular/core/testing';
import { LocationComponent } from './location.component';
import { inventoryTestProviders } from '../../testing';
import { vi } from 'vitest';
describe('LocationComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [LocationComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(LocationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });

  it('muestra equipos de la ubicación y dirige agregados/movimientos al flujo interno', async () => {
    const setup = inventoryTestProviders();
    setup.session.context.update((c) => ({
      ...c,
      yards: [{ uuid: 'yard-1', permissions: ['INVENTORY_READ', 'MOVEMENT_MANAGE'] }],
    }));
    await TestBed.configureTestingModule({
      imports: [LocationComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(LocationComponent);
    const component = fixture.componentInstance;
    component.row.set({
      uuid: 'location-1', yardUuid: 'yard-1', parentUuid: null, code: 'R-01', name: 'Rack 1',
      type: 'RACK', active: true, maxPositions: null, maxWeightKg: null, maxWeightKgExact: null, exclusive: false,
      version: 1,
    });
    component.assets.set([{
      uuid: 'asset-1', rootAssetUuid: 'asset-1', internalCode: 'EQ-1', serialNumber: null,
      lifecycle: 'REGISTERED', yardUuid: 'yard-1', locationUuid: 'location-1', locationCode: 'R-01',
      locationName: 'Rack 1', siteUuid: null, transitMovementUuid: null, placementState: 'YARD', internalMoveEligible: true,
    }]);
    const navigate = vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('EQ-1');
    expect(fixture.nativeElement.querySelector('[aria-label="Seleccionar EQ-1"]')).toBeTruthy();
    component.toggleRoot('asset-1', true);
    component.moveSelected();
    expect(navigate).toHaveBeenLastCalledWith(['/inventario/movimientos/nuevo'], expect.objectContaining({
      queryParams: expect.objectContaining({ type: 'TRANSFER', destinationLocationUuid: 'location-1', internal: 'true' }),
    }));
    component.addUnlocated();
    expect(navigate).toHaveBeenLastCalledWith(['/inventario/movimientos/nuevo'], expect.objectContaining({
      queryParams: expect.objectContaining({ type: 'INBOUND', destinationLocationUuid: 'location-1', internal: 'true' }),
    }));
    fixture.destroy();
  });
});
