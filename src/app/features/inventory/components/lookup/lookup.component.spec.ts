import { TestBed } from '@angular/core/testing';
import { LookupComponent } from './lookup.component';
import { inventoryTestProviders } from '../../testing';
describe('LookupComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [LookupComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(LookupComponent);
    fixture.componentRef.setInput('kind', 'assets');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
