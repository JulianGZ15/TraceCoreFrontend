import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormValidationFeedback } from '../../../../shared/ui/form-validation-feedback';
import { InspectionComponent } from './inspection.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('InspectionComponent · editors', () => {
  let fixture: ComponentFixture<InspectionComponent>;
  let setup: ReturnType<typeof qualityTestProviders>;
  const policyUuid = '00000000-0000-4000-8000-000000000002';
  const inspectorUuid = '00000000-0000-4000-8000-000000000003';
  const scheduledAt = '2026-10-23T18:00:00Z';

  beforeEach(async () => {
    sessionStorage.removeItem('tracecore.quality.pending');
    setup = qualityTestProviders();
    setup.session.context.update((context) => ({
      ...context,
      companyPermissions: [...context.companyPermissions, 'INSPECTION_MANAGE'],
    }));
    await TestBed.configureTestingModule({
      imports: [InspectionComponent],
      providers: [...setup.providers, FormValidationFeedback],
    }).compileComponents();
    TestBed.inject(FormValidationFeedback);
    fixture = TestBed.createComponent(InspectionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('explica qué lugar solicita y muestra el límite de caracteres', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('tc-date-field input[type="datetime-local"]'),
    ).toHaveLength(1);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '#quality-inspection-facility',
    );
    expect(input.required).toBe(true);
    expect(input.maxLength).toBe(500);
    expect(
      fixture.nativeElement.querySelector('#quality-inspection-facility-help').textContent,
    ).toContain('nombre del lugar donde se realizará la inspección');
  });

  it('cuenta la política sin seleccionar y el lugar vacío, muestra sus errores y bloquea el envío', async () => {
    fixture.componentInstance.form.patchValue({ inspectorUuid, scheduledAt });
    fixture.detectChanges();
    await fixture.whenStable();
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(form.querySelector('.tc-validation-summary')?.textContent).toContain('2 datos pendientes');
    const policy: HTMLInputElement = form.querySelector('input[aria-label="Política aplicable"]')!;
    expect(policy.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(policy);
    const policyError = document.getElementById(policy.getAttribute('aria-describedby')!)!;
    expect(policyError.hidden).toBe(false);
    expect(policyError.textContent).toContain('Selecciona política aplicable');
    const facilityError: HTMLElement = form.querySelector('#quality-inspection-facility-error')!;
    expect(facilityError.hidden).toBe(false);
    expect(facilityError.textContent).toContain(
      'Indica el lugar donde se realizará la inspección.',
    );
    expect(setup.api.post).not.toHaveBeenCalled();
  });

  it.each(['', '   ', 'x'.repeat(501)])(
    'bloquea un lugar vacío, en blanco o demasiado largo (%#)',
    async (facility) => {
      fixture.componentInstance.form.patchValue({
        policyUuid,
        inspectorUuid,
        scheduledAt,
        facility,
      });
      await fixture.componentInstance.save();
      expect(fixture.componentInstance.form.controls.facility.invalid).toBe(true);
      expect(setup.api.post).not.toHaveBeenCalled();
    },
  );

  it('admite 500 caracteres y envía el nombre sin espacios alrededor', async () => {
    setup.session.context.update((context) => ({
      ...context,
      yards: [{ uuid: 'yard-1', active: true, permissions: ['INSPECTION_MANAGE'] }],
    }));
    setup.api.get.mockImplementation(async (path: string) =>
      path.endsWith('/summary') ? ({ ...testAsset, yardUuid: 'yard-1' } as never) : [],
    );
    const form = fixture.componentInstance.form;
    form.controls.facility.setValue('x'.repeat(500));
    expect(form.controls.facility.valid).toBe(true);
    form.patchValue({
      assetUuid: testAsset.uuid,
      policyUuid,
      inspectorUuid,
      scheduledAt,
      facility: '  Taller de pruebas (DEMO)  ',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(form.valid).toBe(true);
    expect(fixture.componentInstance.canWrite()).toBe(true);
    await fixture.componentInstance.save();
    expect(fixture.componentInstance.error()).toBe('');
    expect(setup.api.post).toHaveBeenCalledWith(
      '/inspections',
      {
        assetUuid: testAsset.uuid,
        policyUuid,
        inspectorUuid,
        scheduledAt,
        facility: 'Taller de pruebas (DEMO)',
      },
      expect.any(String),
    );
  });
});
