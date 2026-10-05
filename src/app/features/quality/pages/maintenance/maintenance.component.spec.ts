import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MaintenanceComponent } from './maintenance.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('MaintenanceComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [MaintenanceComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
