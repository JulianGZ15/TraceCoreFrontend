import { TestBed } from '@angular/core/testing';
import { ObservationEditorComponent } from './observation-editor.component';
import { inventoryTestProviders } from '../../testing';
describe('ObservationEditorComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [ObservationEditorComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(ObservationEditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
