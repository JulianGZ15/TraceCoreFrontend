import { TestBed } from '@angular/core/testing';
import { InventoryNavComponent } from './inventory-nav.component';
import { inventoryTestProviders } from '../../testing';
describe('InventoryNavComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [InventoryNavComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(InventoryNavComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
