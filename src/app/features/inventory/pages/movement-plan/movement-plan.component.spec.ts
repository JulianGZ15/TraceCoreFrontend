import { TestBed } from '@angular/core/testing';
import { MovementPlanComponent } from './movement-plan.component';
import { inventoryTestProviders } from '../../testing';
describe('MovementPlanComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [MovementPlanComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MovementPlanComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
