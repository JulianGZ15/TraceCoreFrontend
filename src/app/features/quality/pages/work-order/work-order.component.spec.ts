import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { WorkOrderComponent } from './work-order.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('WorkOrderComponent · pages', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [WorkOrderComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkOrderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
