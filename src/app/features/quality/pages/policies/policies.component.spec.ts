import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { PoliciesComponent } from './policies.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('PoliciesComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [PoliciesComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(PoliciesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
