import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { PolicyComponent } from './policy.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('PolicyComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [PolicyComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(PolicyComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
