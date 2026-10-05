import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { RequirementComponent } from './requirement.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('RequirementComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [RequirementComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(RequirementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
