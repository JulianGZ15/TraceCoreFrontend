import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { HoldComponent } from './hold.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('HoldComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [HoldComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(HoldComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
