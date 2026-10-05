import { TestBed } from '@angular/core/testing';
import { LocationComponent } from './location.component';
import { inventoryTestProviders } from '../../testing';
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
});
