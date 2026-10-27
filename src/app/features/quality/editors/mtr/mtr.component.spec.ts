import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MtrComponent } from './mtr.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('MtrComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [MtrComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MtrComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.form.controls.evidenceUuid.hasError('required')).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('tc-date-field input[type="datetime-local"]')).toHaveLength(1);
    fixture.destroy();
  });
});
