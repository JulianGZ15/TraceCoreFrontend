import { TestBed } from '@angular/core/testing';
import { CountComponent } from './count.component';
import { inventoryTestProviders } from '../../testing';
describe('CountComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [CountComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(CountComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
