import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { StandardsComponent } from './standards.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('StandardsComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [StandardsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(StandardsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
