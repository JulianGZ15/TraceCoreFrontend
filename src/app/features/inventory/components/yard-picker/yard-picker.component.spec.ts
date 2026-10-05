import { TestBed } from '@angular/core/testing';
import { YardPickerComponent } from './yard-picker.component';
import { inventoryTestProviders } from '../../testing';
describe('YardPickerComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [YardPickerComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(YardPickerComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
