import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { HoldsComponent } from './holds.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('HoldsComponent · sections', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [HoldsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(HoldsComponent);
    fixture.componentRef.setInput('asset', testAsset);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
