import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { UnsavedChanges } from './unsaved-changes';

describe('UnsavedChanges', () => {
  it('opens the shared confirmation only for a dirty form', async () => {
    const open = vi.fn(() => ({ closed: of(true) }));
    await TestBed.configureTestingModule({
      providers: [UnsavedChanges, { provide: Dialog, useValue: { open } }],
    }).compileComponents();

    const service = TestBed.inject(UnsavedChanges);
    await expect(service.confirmDiscard(false)).resolves.toBe(true);
    expect(open).not.toHaveBeenCalled();
    await expect(service.confirmDiscard(true)).resolves.toBe(true);
    expect(open).toHaveBeenCalledOnce();
  });
});
