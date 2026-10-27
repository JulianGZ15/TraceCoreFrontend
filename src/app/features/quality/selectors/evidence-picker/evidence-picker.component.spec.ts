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

  it('sube evidencia y coloca su UUID en el control que se enviará con el MTR', async () => {
    const setup = qualityTestProviders();
    setup.session.context().companyPermissions.push('QUALITY_MANAGE');
    setup.api.upload.mockResolvedValue({ uuid: 'evidence-1', fileName: 'mtr.pdf' });
    await TestBed.configureTestingModule({
      imports: [EvidencePickerComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(EvidencePickerComponent);
    const control = new FormControl('');
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('allowUpload', true);
    fixture.detectChanges();
    fixture.componentInstance.selectFile({
      target: { files: [new File(['%PDF'], 'mtr.pdf', { type: 'application/pdf' })] },
    } as unknown as Event);

    await fixture.componentInstance.uploadSelected();

    expect(setup.api.upload).toHaveBeenCalledOnce();
    expect(control.value).toBe('evidence-1');
    expect(fixture.componentInstance.selectedLabel()).toBe('mtr.pdf');
    fixture.destroy();
  });
});
