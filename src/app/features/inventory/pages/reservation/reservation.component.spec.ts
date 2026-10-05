import { TestBed } from '@angular/core/testing';
import { ReservationComponent } from './reservation.component';
import { inventoryTestProviders } from '../../testing';
describe('ReservationComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [ReservationComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ReservationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
