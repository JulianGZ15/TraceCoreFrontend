import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Session } from '../../../../core/auth/session';
import { PhotosApi } from '../../photos-api';
import { EquipmentPhoto } from '../../photos.models';
import { PhotoViewerComponent } from './photo-viewer.component';

describe('PhotoViewerComponent', () => {
  let fixture: ComponentFixture<PhotoViewerComponent> | undefined;
  let component: PhotoViewerComponent;
  let ended: Subject<void>;
  let photo: EquipmentPhoto;
  let api: { detail: ReturnType<typeof vi.fn>; image: ReturnType<typeof vi.fn>; history: ReturnType<typeof vi.fn>;
    correct: ReturnType<typeof vi.fn>; transition: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let revokeUrl: ReturnType<typeof vi.fn<typeof URL.revokeObjectURL>>;

  beforeEach(async () => {
    const image = { mediaType: 'image/png', size: 20, width: 80, height: 40, sha256: 'a'.repeat(64) };
    photo = {
      uuid: '00000000-0000-4000-8000-000000000201', assetUuid: '00000000-0000-4000-8000-000000000202',
      description: 'Vista inicial', state: 'ACTIVE', uploadedBy: { uuid: 'staff', name: 'Personal autorizado' },
      uploadedAt: '2026-01-01T12:00:00Z', uploadChannel: 'WEB', original: { ...image, filename: 'equipment.png' },
      capture: { takenAtLocal: null, offsetMinutes: null, source: 'UNKNOWN', exifTakenAtLocal: null, exifOffsetMinutes: null,
        cameraMake: null, cameraModel: null, originalOrientation: null },
      images: { master: image, preview: image, thumbnail: image }, archivedBy: null, archivedAt: null, archiveReason: null, version: 4,
    };
    ended = new Subject<void>();
    api = {
      detail: vi.fn().mockResolvedValue(photo), image: vi.fn().mockResolvedValue(new Blob(['image'], { type: 'image/png' })),
      history: vi.fn().mockResolvedValue({ items: [], offset: 0, limit: 10, hasMore: false }),
      correct: vi.fn().mockResolvedValue({ ...photo, version: 5 }), transition: vi.fn(),
    };
    dialog = { open: vi.fn() }; dialogRef = { close: vi.fn() }; revokeUrl = vi.fn<typeof URL.revokeObjectURL>();
    const OriginalUrl = URL;
    vi.stubGlobal('URL', class extends OriginalUrl {
      static override createObjectURL = vi.fn(() => 'blob:viewer-photo');
      static override revokeObjectURL(value: string): void { revokeUrl(value); }
    });
    await TestBed.configureTestingModule({
      imports: [PhotoViewerComponent],
      providers: [
        { provide: PhotosApi, useValue: api },
        { provide: Session, useValue: { ended, can: () => true, valid: () => true, context: () => ({ company: { timezone: 'UTC' } }) } },
        { provide: Dialog, useValue: dialog }, { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { asset: photo.assetUuid, photos: [photo], index: 0, readOnly: false } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PhotoViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy(); fixture = undefined;
    ended.complete(); vi.unstubAllGlobals();
  });

  it('requires a nonblank reason before correction or archive writes', async () => {
    component.form.patchValue({ description: 'Descripción editada', reason: '   ' });

    await component.save(); await component.transition(); fixture!.detectChanges();

    expect(api.correct).not.toHaveBeenCalled();
    expect(api.transition).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(component.form.controls.reason.touched).toBe(true);
    expect(component.form.controls.reason.invalid).toBe(true);
    expect(component.error()).toContain('motivo del cambio');
    expect(fixture!.nativeElement.querySelector('#photo-edit-reason').getAttribute('aria-invalid')).toBe('true');
    expect(fixture!.nativeElement.textContent).toContain('Indica el motivo.');
  });

  it('retains all edited fields and the loaded revision after a correction conflict', async () => {
    api.correct.mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    const edited = { description: 'Vista corregida', takenAtLocal: '2025-02-03T04:05', offset: '-06:00', reason: 'Fecha confirmada por personal' };
    component.form.setValue(edited);

    await component.save(); fixture!.detectChanges();

    expect(api.correct).toHaveBeenCalledTimes(1);
    expect(api.correct.mock.calls[0].slice(0, 3)).toEqual([photo.assetUuid, photo.uuid, {
      version: 4, description: edited.description, takenAtLocal: edited.takenAtLocal, offsetMinutes: -360, reason: edited.reason,
    }]);
    expect(component.form.getRawValue()).toEqual(edited);
    expect(component.photo()?.version).toBe(4);
    expect(component.photo()?.description).toBe('Vista inicial');
    expect(component.error()).toContain('conflicto');
    expect(component.busy()).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('revokes the current image object URL when the viewer is destroyed', () => {
    expect(component.url()).toBe('blob:viewer-photo');
    fixture!.destroy(); fixture = undefined;

    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:viewer-photo');
    expect(component.url()).toBe('');
  });

  it('closes when the authenticated session ends', () => {
    ended.next();
    expect(dialogRef.close).toHaveBeenCalledExactlyOnceWith(false);
  });
});
