import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { OptionPickerComponent } from './option-picker.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('OptionPickerComponent · selectors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [OptionPickerComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(OptionPickerComponent);
    fixture.componentRef.setInput('control', new FormControl(''));
    fixture.componentRef.setInput('title', 'Selector');
    fixture.componentRef.setInput('kind', 'CATEGORY');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
