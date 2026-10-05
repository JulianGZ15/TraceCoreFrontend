import { TestBed } from '@angular/core/testing';
import { AssetsComponent } from './assets.component';
import { inventoryTestProviders } from '../../testing';
describe('AssetsComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [AssetsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(AssetsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
