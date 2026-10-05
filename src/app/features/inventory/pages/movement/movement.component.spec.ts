import { TestBed } from '@angular/core/testing';
import { MovementComponent } from './movement.component';
import { inventoryTestProviders } from '../../testing';
describe('MovementComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [MovementComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MovementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
