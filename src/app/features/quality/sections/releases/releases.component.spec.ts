import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { ReleasesComponent } from './releases.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('ReleasesComponent · sections', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [ReleasesComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ReleasesComponent);
    fixture.componentRef.setInput('asset', testAsset);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
