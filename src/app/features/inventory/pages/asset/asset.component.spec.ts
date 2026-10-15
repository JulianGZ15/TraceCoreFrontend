import { TestBed } from '@angular/core/testing';
import { AssetComponent } from './asset.component';
import { inventoryTestProviders } from '../../testing';
import { vi } from 'vitest';
import type * as M from '../../models';
describe('AssetComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [AssetComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(AssetComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });

  it('ofrece asignación desde la ficha solo a equipos elegibles', async () => {
    const setup = inventoryTestProviders();
    setup.session.context.update((c) => ({
      ...c,
      yards: [{ uuid: 'yard-1', permissions: ['INVENTORY_READ', 'MOVEMENT_MANAGE'] }],
    }));
    await TestBed.configureTestingModule({
      imports: [AssetComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(AssetComponent);
    const component = fixture.componentInstance;
    const profile = {
      asset: { uuid: 'asset-1', internalCode: 'EQ-1' },
      assignment: null,
      custody: null,
      transit: null,
      placementState: 'UNLOCATED',
    } as M.Profile;
    component.profile.set(profile);
    component.currentYard.set('yard-1');
    const navigate = vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
    expect(component.canChangeLocation()).toBe(true);
    component.changeLocation();
    expect(navigate).toHaveBeenCalledWith(['/inventario/movimientos/nuevo'], expect.objectContaining({
      queryParams: expect.objectContaining({ type: 'INBOUND', assetUuids: 'asset-1', internal: 'true' }),
    }));
    component.profile.set({ ...profile, placementState: 'EXTERNAL_SITE' });
    expect(component.canChangeLocation()).toBe(false);
    fixture.destroy();
  });
});
