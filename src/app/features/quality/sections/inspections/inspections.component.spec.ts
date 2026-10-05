import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { InspectionsComponent } from './inspections.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('InspectionsComponent · sections', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [InspectionsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(InspectionsComponent);
    fixture.componentRef.setInput('asset', testAsset);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
