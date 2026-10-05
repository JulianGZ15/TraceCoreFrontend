import { TestBed } from '@angular/core/testing';
import { ReservationsComponent } from './reservations.component';
import { inventoryTestProviders } from '../../testing';
describe('ReservationsComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [ReservationsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ReservationsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
