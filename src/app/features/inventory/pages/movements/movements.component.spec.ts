import { TestBed } from '@angular/core/testing';
import { MovementsComponent } from './movements.component';
import { inventoryTestProviders } from '../../testing';
describe('MovementsComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [MovementsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MovementsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
