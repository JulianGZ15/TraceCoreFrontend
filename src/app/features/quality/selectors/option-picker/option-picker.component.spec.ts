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
    const uuid = '1a8a6df8-064a-48e7-b361-7fe599a140aa';
    fixture.componentInstance.control().setValue(uuid);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(uuid);
    expect(fixture.nativeElement.querySelector('tc-pagination')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[formControl]')).toBeNull();
    fixture.destroy();
  });
});
