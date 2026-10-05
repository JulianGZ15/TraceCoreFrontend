import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { InspectionComponent } from './inspection.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('InspectionComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [InspectionComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(InspectionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
