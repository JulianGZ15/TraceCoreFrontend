import { TestBed } from '@angular/core/testing';
import { ProposalComponent } from './proposal.component';
import { inventoryTestProviders } from '../../testing';
describe('ProposalComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [ProposalComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ProposalComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
