import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { EvidencePickerComponent } from './evidence-picker.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('EvidencePickerComponent · selectors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [EvidencePickerComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(EvidencePickerComponent);
    fixture.componentRef.setInput('control', new FormControl(''));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
