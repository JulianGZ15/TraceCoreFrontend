import { ManifestNewComponent } from './manifest-new.component';
import { renderLogistics, testId } from '../../testing';
import { FormGroup } from '@angular/forms';
describe('ManifestNewComponent', () => {
  it('validates the current stage and prevents stepper jumps over unfinished stages', async () => {
    const fixture = await renderLogistics(ManifestNewComponent, {});
    const component = fixture.componentInstance;

    await component.go(4);
    expect(component.step()).toBe(1);
    component.form.get('carrierUuid')?.setValue('carrier-1');
    component.form.get('destinationSiteUuid')?.setValue('site-1');
    component.form.get('destinationCustodianUuid')?.setValue('custodian-1');
    component.form.get('reason')?.setValue('Entrega externa');
    component.form.get('sourceReference')?.setValue('REF-1');

    await component.go(4);
    expect(component.step()).toBe(2);
    await component.go(4);
    expect(component.step()).toBe(2);

    component.saved.set([
      { movement: { uuid: 'movement-1' } as never, root: 'root-1', allocation: '', line: '', reference: '' },
    ]);
    await component.go(4);
    expect(component.step()).toBe(3);
    await component.go(4);
    expect(component.step()).toBe(4);
    fixture.destroy();
  });

  it('requires an operational yard before leaving the context stage', async () => {
    const fixture = await renderLogistics(ManifestNewComponent, {});
    const component = fixture.componentInstance;
    component.form.get('carrierUuid')?.setValue('carrier-1');
    component.form.get('destinationSiteUuid')?.setValue('site-1');
    component.form.get('destinationCustodianUuid')?.setValue('custodian-1');
    component.form.get('reason')?.setValue('Entrega externa');
    component.form.get('sourceReference')?.setValue('REF-1');
    component.yardControl.setValue('');

    await component.go(2);
    expect(component.step()).toBe(1);
    expect(component.yardControl.touched).toBe(true);
    fixture.destroy();
  });

  it('shows only destination fields that apply to the selected manifest type', async () => {
    const fixture = await renderLogistics(ManifestNewComponent, {});
    const component = fixture.componentInstance;

    expect(component.visibleFields.map((field) => field.key)).toContain('destinationSiteUuid');
    expect(component.visibleFields.map((field) => field.key)).not.toContain('destinationYardUuid');

    component.form.controls['type'].setValue('TRANSFER');
    expect(component.visibleFields.map((field) => field.key)).toContain('destinationYardUuid');
    expect(component.visibleFields.map((field) => field.key)).not.toContain('destinationSiteUuid');
    expect(component.visibleFields.map((field) => field.key)).not.toContain('destinationCustodianUuid');
    fixture.destroy();
  });

  it('renders authorized read context without permitting a write', async () => {
    const fixture = await renderLogistics(ManifestNewComponent, {});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('tc-stepper li.stepper-item')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('tc-stepper button[aria-current="step"]')).toBeTruthy();
    const form = fixture.nativeElement.querySelector('button.btn.primary');
    if (form && form.textContent?.trim() === 'Guardar') expect(form.disabled).toBe(true);
  });
});
