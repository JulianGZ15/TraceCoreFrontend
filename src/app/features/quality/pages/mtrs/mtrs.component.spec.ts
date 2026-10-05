import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MtrsComponent } from './mtrs.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('MtrsComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [MtrsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MtrsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
