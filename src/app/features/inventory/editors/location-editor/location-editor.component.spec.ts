import { TestBed } from '@angular/core/testing';
import { LocationEditorComponent } from './location-editor.component';
import { inventoryTestProviders } from '../../testing';
describe('LocationEditorComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [LocationEditorComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(LocationEditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
