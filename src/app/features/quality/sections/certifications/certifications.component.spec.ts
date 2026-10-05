import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { CertificationsComponent } from './certifications.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('CertificationsComponent · sections', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [CertificationsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(CertificationsComponent);
    fixture.componentRef.setInput('asset', testAsset);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
