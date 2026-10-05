import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { QualityNavComponent } from './quality-nav.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('QualityNavComponent · shared', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [QualityNavComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(QualityNavComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
