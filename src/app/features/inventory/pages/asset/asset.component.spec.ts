import { TestBed } from '@angular/core/testing';
import { AssetComponent } from './asset.component';
import { inventoryTestProviders } from '../../testing';
describe('AssetComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [AssetComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(AssetComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
