import { Component, computed, DestroyRef, effect, inject, input, OnDestroy, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Session } from '../../../../core/auth/session';
import { workspaceError } from '../../../../core/http/workspace-api';
import { DateFieldComponent } from '../../../../shared/ui/date-field/date-field.component';
import { PhotosApi } from '../../photos-api';
import { EquipmentPhoto, offsetMinutes, photoOffsetValidator, takenText } from '../../photos.models';
import { PhotoViewerComponent } from '../photo-viewer/photo-viewer.component';

interface PendingPhoto {
  file: File; result: string; status: 'pending' | 'uploading' | 'done' | 'error';
  form: FormGroup<{ description: FormControl<string>; takenAtLocal: FormControl<string>; offset: FormControl<string> }>;
}

@Component({
  selector: 'tc-photo-gallery',
  imports: [ReactiveFormsModule, DateFieldComponent],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.scss',
})
export class PhotoGalleryComponent implements OnDestroy {
  readonly assetUuid = input('');
  readonly readOnly = input(false);
  readonly query = input(false);
  readonly session = inject(Session);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PhotosApi);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeAsset = signal('');
  readonly asset = computed(() => this.assetUuid() || this.routeAsset());
  readonly manage = computed(() => !this.readOnly() && this.session.can('EQUIPMENT_READ') && this.session.can('EQUIPMENT_MANAGE'));
  readonly rows = signal<EquipmentPhoto[]>([]);
  readonly thumbnails = signal<Record<string, string>>({});
  readonly thumbnailErrors = signal<Record<string, boolean>>({});
  readonly pending = signal<PendingPhoto[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly state = signal<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  readonly offset = signal(0);
  readonly hasMore = signal(false);
  readonly takenText = takenText;
  private readonly stop = new Subject<void>();
  private generation = 0;
  private destroyed = false;
  private previousAsset = '';
  constructor() {
    (this.route.parent ?? this.route).paramMap.pipe(takeUntilDestroyed()).subscribe(params => this.routeAsset.set(params.get('uuid') ?? ''));
    this.session.ended.pipe(takeUntilDestroyed()).subscribe(() => { this.cancel(); this.rows.set([]); this.pending.set([]); });
    effect(() => { const asset = this.asset(); this.state(); this.query(); if (asset) untracked(() => {
      if (asset !== this.previousAsset) { this.cancel(); this.pending.set([]); this.previousAsset = asset; }
      void this.load(0);
    }); });
    effect(() => { if (!this.session.can('EQUIPMENT_READ')) untracked(() => { this.cancel(); this.rows.set([]); this.pending.set([]); }); });
  }
  private cancel() {
    this.generation++; this.stop.next();
    Object.values(this.thumbnails()).forEach(url => URL.revokeObjectURL(url)); this.thumbnails.set({});
  }
  async load(offset = this.offset()) {
    if (this.uploading()) return;
    this.cancel(); const generation = this.generation;
    this.offset.set(offset); this.loading.set(true); this.error.set(''); this.thumbnailErrors.set({}); this.rows.set([]);
    try {
      const page = await this.api.list(this.asset(), this.state(), offset, this.stop, this.query());
      if (generation !== this.generation) return;
      this.rows.set(page.items); this.hasMore.set(page.hasMore);
      void Promise.all(page.items.map(photo => this.thumbnail(photo, generation)));
    } catch (error) { if (generation === this.generation && this.session.valid()) this.error.set(workspaceError(error)); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }
  async thumbnail(photo: EquipmentPhoto, generation = this.generation) {
    try {
      const blob = await this.api.image(this.asset(), photo.uuid, 'thumbnail', this.stop);
      if (generation !== this.generation || this.destroyed) return;
      const old = this.thumbnails()[photo.uuid]; if (old) URL.revokeObjectURL(old);
      this.thumbnails.update(values => ({ ...values, [photo.uuid]: URL.createObjectURL(blob) }));
      this.thumbnailErrors.update(values => ({ ...values, [photo.uuid]: false }));
    } catch { if (generation === this.generation) this.thumbnailErrors.update(values => ({ ...values, [photo.uuid]: true })); }
  }
  select(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []); input.value = '';
    this.pending.update(items => [...items, ...files.map(file => ({ file, status: 'pending' as const, result: '',
      form: new FormGroup({ description: new FormControl('', { nonNullable: true, validators: Validators.maxLength(1000) }),
        takenAtLocal: new FormControl('', { nonNullable: true }), offset: new FormControl('', { nonNullable: true, validators: photoOffsetValidator }) }),
    }))]);
  }
  remove(item: PendingPhoto) { if (!this.uploading()) this.pending.update(items => items.filter(row => row !== item)); }
  retry(item: PendingPhoto) { if (!this.uploading() && item.status === 'error') { item.status = 'pending'; item.result = ''; this.pending.update(rows => [...rows]); } }
  async upload() {
    if (this.uploading() || !this.manage()) return;
    this.uploading.set(true); const asset = this.asset();
    try {
      for (const item of this.pending()) {
        if (this.destroyed || !this.session.valid() || !this.manage() || this.asset() !== asset) break;
        if (item.status !== 'pending') continue;
        item.form.markAllAsTouched();
        try {
          if (!/\.(jpe?g|png)$/i.test(item.file.name) || item.file.size === 0 || item.file.size > 10485760) throw new Error('Selecciona JPEG o PNG de hasta 10 MiB.');
          if (item.form.invalid) throw new Error('Revisa los datos de esta foto.');
          const values = item.form.getRawValue(); const zone = offsetMinutes(values.offset);
          if (zone != null && !values.takenAtLocal) throw new Error('Indica la fecha de toma o deja vacía su zona.');
          const form = new FormData(); form.append('file', item.file);
          if (values.description) form.append('description', values.description);
          if (values.takenAtLocal) form.append('takenAtLocal', values.takenAtLocal);
          if (zone != null) form.append('offsetMinutes', String(zone));
          item.status = 'uploading'; item.result = 'Subiendo…'; this.pending.update(rows => [...rows]);
          await this.api.upload(asset, form, this.stop);
          item.status = 'done'; item.result = 'Foto guardada';
        } catch (error) {
          item.status = 'error'; item.result = `${workspaceError(error)} Si hubo un corte de conexión, actualiza la galería antes de volver a seleccionar el archivo.`;
        }
        this.pending.update(rows => [...rows]);
      }
    } finally { this.uploading.set(false); if (!this.destroyed && this.session.valid()) await this.load(0); }
  }
  open(index: number) {
    this.dialog.open<boolean>(PhotoViewerComponent, { data: { asset: this.asset(), photos: this.rows(), index, readOnly: !this.manage() },
      width: '1040px', maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100dvh - 24px)', ariaLabel: 'Foto del equipo',
    }).closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(changed => { if (changed) void this.load(); });
  }
  ngOnDestroy() { this.destroyed = true; this.cancel(); this.stop.complete(); }
}
