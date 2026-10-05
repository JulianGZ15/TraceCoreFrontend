import { TestBed } from '@angular/core/testing';
import { ReservationEditorComponent } from './reservation-editor.component';
import { inventoryTestProviders } from '../../testing';
describe('ReservationEditorComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [ReservationEditorComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ReservationEditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
