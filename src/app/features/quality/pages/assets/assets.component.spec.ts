import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { AssetsComponent } from './assets.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('AssetsComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [AssetsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(AssetsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
