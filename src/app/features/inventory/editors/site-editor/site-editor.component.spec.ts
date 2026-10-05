import { TestBed } from '@angular/core/testing';
import { SiteEditorComponent } from './site-editor.component';
import { inventoryTestProviders } from '../../testing';
describe('SiteEditorComponent', () => {
  it('renderiza el estado inicial y permite destruir la vista', async () => {
    const setup = inventoryTestProviders();
    await TestBed.configureTestingModule({
      imports: [SiteEditorComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(SiteEditorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim().length).toBeGreaterThan(0);
    fixture.destroy();
  });
});
