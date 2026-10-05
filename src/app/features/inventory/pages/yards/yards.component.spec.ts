import { TestBed } from '@angular/core/testing';
import { YardsComponent } from './yards.component';
import { inventoryTestProviders } from '../../testing';
describe('YardsComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [YardsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(YardsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
