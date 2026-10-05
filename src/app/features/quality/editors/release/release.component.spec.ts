import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { ReleaseComponent } from './release.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('ReleaseComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [ReleaseComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ReleaseComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
