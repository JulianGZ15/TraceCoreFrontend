import { TestBed } from '@angular/core/testing';
import { CountsComponent } from './counts.component';
import { inventoryTestProviders } from '../../testing';
describe('CountsComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [CountsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(CountsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
