import { TestBed } from '@angular/core/testing';
import { SitesComponent } from './sites.component';
import { inventoryTestProviders } from '../../testing';
describe('SitesComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [SitesComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(SitesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
