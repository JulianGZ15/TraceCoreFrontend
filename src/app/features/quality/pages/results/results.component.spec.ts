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
    fixture.componentInstance.record.set({
      uuid: 'inspection',
      state: 'PLANNED',
      version: 0,
      criteria: [],
    } as never);
    fixture.componentInstance.asset.set(testAsset as never);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tc-date-field input[type="datetime-local"]')).toHaveLength(1);
    fixture.destroy();
  });
});
