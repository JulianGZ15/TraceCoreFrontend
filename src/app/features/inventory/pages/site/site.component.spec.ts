import { TestBed } from '@angular/core/testing';
import { SiteComponent } from './site.component';
import { inventoryTestProviders } from '../../testing';
describe('SiteComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [SiteComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(SiteComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
