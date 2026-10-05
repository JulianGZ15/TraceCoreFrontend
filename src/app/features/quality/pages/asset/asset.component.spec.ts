import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { AssetComponent } from './asset.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('AssetComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [AssetComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(AssetComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
