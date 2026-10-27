import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { MaintenanceComponent } from './maintenance.component';
import { qualityTestProviders } from '../../testing';
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

  it('requests the published maintenance collection', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [MaintenanceComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(setup.api.get).toHaveBeenCalledWith(
      '/maintenance',
      expect.objectContaining({ offset: 0, limit: 25 }),
      expect.anything(),
    );
    fixture.destroy();
  });

  it('does not render an empty table alongside a load error and offers a safe reload', async () => {
    const setup = qualityTestProviders();
    vi.mocked(setup.api.get).mockRejectedValue(new HttpErrorResponse({ status: 400 }));
    await TestBed.configureTestingModule({
      imports: [MaintenanceComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar la información');
    expect(fixture.nativeElement.textContent).not.toContain('Sin registros.');
    expect(fixture.nativeElement.querySelector('tc-data-table')).toBeNull();
    expect(fixture.nativeElement.querySelector('tc-feedback button')?.textContent).toContain(
      'Volver a cargar',
    );
    fixture.destroy();
  });
});
