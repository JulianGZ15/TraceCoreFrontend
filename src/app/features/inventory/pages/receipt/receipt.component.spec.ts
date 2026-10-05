import { TestBed } from '@angular/core/testing';
import { ReceiptComponent } from './receipt.component';
import { inventoryTestProviders } from '../../testing';
describe('ReceiptComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [ReceiptComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ReceiptComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
