import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { CertificationComponent } from './certification.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('CertificationComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [CertificationComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(CertificationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tc-date-field input[type="datetime-local"]')).toHaveLength(2);
    fixture.destroy();
  });
});
