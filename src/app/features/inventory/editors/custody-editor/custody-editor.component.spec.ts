import { TestBed } from '@angular/core/testing';
import { CustodyEditorComponent } from './custody-editor.component';
import { inventoryTestProviders } from '../../testing';
describe('CustodyEditorComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [CustodyEditorComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(CustodyEditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
