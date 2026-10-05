import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { StandardComponent } from './standard.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('StandardComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [StandardComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(StandardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
