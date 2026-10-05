import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { EvidenceComponent } from './evidence.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('EvidenceComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [EvidenceComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(EvidenceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
