import { TestBed } from '@angular/core/testing';
import { ProposalsComponent } from './proposals.component';
import { inventoryTestProviders } from '../../testing';
describe('ProposalsComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [ProposalsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ProposalsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
