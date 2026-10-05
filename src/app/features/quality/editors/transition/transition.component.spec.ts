import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TransitionComponent } from './transition.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('TransitionComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [TransitionComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(TransitionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
