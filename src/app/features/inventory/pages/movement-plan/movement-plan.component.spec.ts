import { TestBed } from '@angular/core/testing';
import { MovementPlanComponent } from './movement-plan.component';
import { inventoryTestProviders } from '../../testing';
describe('MovementPlanComponent', () => {
  it('requires each stage before stepper navigation can move forward', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [MovementPlanComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MovementPlanComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.goStep(4);
    expect(component.step()).toBe(1);
    component.sourceChanged('yard-source');
    component.goStep(4);
    expect(component.step()).toBe(2);
    component.goStep(4);
    expect(component.step()).toBe(2);

    component.roots.at(0).controls['assetUuid'].setValue('asset-1');
    component.goStep(4);
    expect(component.step()).toBe(3);
    component.goStep(4);
    expect(component.step()).toBe(3);

    component.roots.at(0).controls['destinationLocationUuid'].setValue('location-1');
    component.form.controls.destinationYardUuid.setValue('yard-destination');
    component.form.controls.reason.setValue('Traslado');
    component.form.controls.sourceReference.setValue('REF-1');
    component.goStep(4);
    expect(component.step()).toBe(4);
    fixture.destroy();
  });

  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [MovementPlanComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(MovementPlanComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('tc-stepper li.stepper-item')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('tc-stepper button[aria-current="step"]')).toBeTruthy();
    fixture.destroy();
  });
});
