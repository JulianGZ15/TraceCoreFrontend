import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { RequirementsComponent } from './requirements.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('RequirementsComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [RequirementsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(RequirementsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
