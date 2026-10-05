import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { ResultsComponent } from './results.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('ResultsComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [ResultsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ResultsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
