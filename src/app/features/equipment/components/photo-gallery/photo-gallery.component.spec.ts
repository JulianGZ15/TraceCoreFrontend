import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Session } from '../../../../core/auth/session';
import { PhotosApi } from '../../photos-api';
import { EquipmentPhoto } from '../../photos.models';
import { PhotoGalleryComponent } from './photo-gallery.component';

describe('PhotoGalleryComponent', () => {
  const assetUuid = '00000000-0000-4000-8000-000000000101';
  let fixture: ComponentFixture<PhotoGalleryComponent> | undefined;
  let ended: Subject<void>;
  let session: { ended: Subject<void>; can: ReturnType<typeof vi.fn>; valid: ReturnType<typeof vi.fn> };
  let api: { list: ReturnType<typeof vi.fn>; image: ReturnType<typeof vi.fn>; upload: ReturnType<typeof vi.fn> };
  let createUrl: ReturnType<typeof vi.fn<typeof URL.createObjectURL>>;
  let revokeUrl: ReturnType<typeof vi.fn<typeof URL.revokeObjectURL>>;

  function photo(): EquipmentPhoto {
    const image = { mediaType: 'image/png', size: 20, width: 80, height: 40, sha256: 'a'.repeat(64) };
    return {
      uuid: '00000000-0000-4000-8000-000000000102', assetUuid, description: 'Vista frontal', state: 'ACTIVE',
      uploadedBy: { uuid: assetUuid, name: 'Personal de equipos' }, uploadedAt: '2026-01-01T12:00:00Z', uploadChannel: 'WEB',
      original: { ...image, filename: 'frontal.png' },
      capture: { takenAtLocal: null, offsetMinutes: null, source: 'UNKNOWN', exifTakenAtLocal: null, exifOffsetMinutes: null,
        cameraMake: null, cameraModel: null, originalOrientation: null },
      images: { master: image, preview: image, thumbnail: image }, archivedBy: null, archivedAt: null, archiveReason: null, version: 0,
    };
  }

  beforeEach(async () => {
    ended = new Subject<void>();
    session = { ended, can: vi.fn(() => true), valid: vi.fn(() => true) };
    api = {
      list: vi.fn().mockResolvedValue({ items: [], offset: 0, limit: 25, hasMore: false }),
      image: vi.fn().mockResolvedValue(new Blob(['image'], { type: 'image/png' })),
      upload: vi.fn().mockResolvedValue(photo()),
    };
    createUrl = vi.fn<typeof URL.createObjectURL>(() => 'blob:equipment-photo');
    revokeUrl = vi.fn<typeof URL.revokeObjectURL>();
    const OriginalUrl = URL;
    vi.stubGlobal('URL', class extends OriginalUrl {
      static override createObjectURL(value: Blob | MediaSource): string { return createUrl(value); }
      static override revokeObjectURL(value: string): void { revokeUrl(value); }
    });
    await TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent],
      providers: [
        { provide: PhotosApi, useValue: api }, { provide: Session, useValue: session },
        { provide: ActivatedRoute, useValue: { parent: null, paramMap: of(convertToParamMap({ uuid: assetUuid })) } },
        { provide: Dialog, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy(); fixture = undefined;
    ended.complete(); vi.unstubAllGlobals();
  });

  async function mount(readOnly = false) {
    fixture = TestBed.createComponent(PhotoGalleryComponent);
    fixture.componentRef.setInput('readOnly', readOnly);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    return fixture.componentInstance;
  }

  function select(component: PhotoGalleryComponent, files: File[]) {
    component.select({ target: { files, value: 'selected-files' } } as unknown as Event);
  }

  it('keeps per-file results and failed metadata while continuing the remaining upload queue', async () => {
    const component = await mount();
    const files = ['frontal.png', 'lateral.jpg', 'placa.png'].map(name => new File(['photo'], name, { type: 'image/png' }));
    select(component, files);
    component.pending()[1].form.patchValue({ description: 'Placa lateral', takenAtLocal: '2025-03-04T12:30', offset: '-06:00' });
    api.upload.mockResolvedValueOnce(photo()).mockRejectedValueOnce(new HttpErrorResponse({ status: 503 })).mockResolvedValueOnce(photo());

    await component.upload(); fixture!.detectChanges();

    expect(api.upload).toHaveBeenCalledTimes(3);
    expect(component.pending().map(item => item.status)).toEqual(['done', 'error', 'done']);
    expect(component.pending().map(item => item.file)).toEqual(files);
    expect(component.pending()[1].form.getRawValue()).toEqual({ description: 'Placa lateral', takenAtLocal: '2025-03-04T12:30', offset: '-06:00' });
    expect(component.pending()[1].result).toContain('almacenamiento');
    expect(component.pending()[1].result).toContain('actualiza la galería');
    expect(component.uploading()).toBe(false);
    const secondForm = api.upload.mock.calls[1][1] as FormData;
    expect(secondForm.get('description')).toBe('Placa lateral');
    expect(secondForm.get('offsetMinutes')).toBe('-360');
    expect(fixture!.nativeElement.textContent).toContain('Foto guardada');

    await component.upload();
    expect(api.upload).toHaveBeenCalledTimes(3);
  });

  it('retains files not processed after the session becomes invalid', async () => {
    const component = await mount();
    const files = ['first.png', 'remaining.png'].map(name => new File(['photo'], name));
    select(component, files);
    api.upload.mockImplementationOnce(async () => { session.valid.mockReturnValue(false); return photo(); });

    await component.upload();

    expect(api.upload).toHaveBeenCalledTimes(1);
    expect(component.pending().map(item => item.status)).toEqual(['done', 'pending']);
    expect(component.pending()[1].file).toBe(files[1]);
    expect(component.uploading()).toBe(false);
  });

  it('hides upload controls in read-only dossiers and refuses a direct upload call', async () => {
    const component = await mount(true);
    select(component, [new File(['photo'], 'equipment.png')]);
    fixture!.detectChanges();

    expect(component.manage()).toBe(false);
    expect(fixture!.nativeElement.querySelector('input[type="file"]')).toBeNull();
    expect(fixture!.nativeElement.textContent).not.toContain('Subir fotos pendientes');
    expect(fixture!.nativeElement.textContent).toContain('Actualizar fotos');
    await component.upload();
    expect(api.upload).not.toHaveBeenCalled();
  });

  it('revokes thumbnail object URLs on reload and clears private content on session end', async () => {
    api.list.mockResolvedValue({ items: [photo()], offset: 0, limit: 25, hasMore: false });
    createUrl.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    const component = await mount();
    await fixture!.whenStable();
    expect(component.thumbnails()[photo().uuid]).toBe('blob:first');

    await component.load(); await fixture!.whenStable();
    expect(revokeUrl).toHaveBeenCalledWith('blob:first');
    expect(component.thumbnails()[photo().uuid]).toBe('blob:second');
    select(component, [new File(['photo'], 'pending.png')]);

    ended.next(); fixture!.detectChanges();

    expect(revokeUrl).toHaveBeenCalledWith('blob:second');
    expect(component.thumbnails()).toEqual({});
    expect(component.rows()).toEqual([]);
    expect(component.pending()).toEqual([]);
  });
});
