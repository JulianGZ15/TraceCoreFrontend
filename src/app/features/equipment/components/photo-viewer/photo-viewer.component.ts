import { Component, DestroyRef, effect, ElementRef, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { Session } from '../../../../core/auth/session';
import { workspaceError } from '../../../../core/http/workspace-api';
import { DateFieldComponent } from '../../../../shared/ui/date-field/date-field.component';
import { confirm } from '../../../../shared/ui/editor';
import { PhotosApi } from '../../photos-api';
import { EquipmentPhoto, PhotoEvent, offsetMinutes, offsetText, photoOffsetValidator, takenText } from '../../photos.models';

@Component({
  selector: 'tc-photo-viewer',
  imports: [ReactiveFormsModule, DateFieldComponent],
  templateUrl: './photo-viewer.component.html',
  styleUrl: './photo-viewer.component.scss',
})
export class PhotoViewerComponent implements OnDestroy {
  readonly data = inject<{ asset: string; photos: EquipmentPhoto[]; index: number; readOnly: boolean }>(DIALOG_DATA);
  private readonly ref = inject(DialogRef<boolean>);
  private readonly api = inject(PhotosApi);
  private readonly session = inject(Session);
  private readonly dialog = inject(Dialog);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly index = signal(this.data.index);
  readonly photo = signal<EquipmentPhoto | null>(null);
  readonly url = signal('');
  readonly zoom = signal(1);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly history = signal<PhotoEvent[]>([]);
  readonly historyError = signal('');
  readonly historyOffset = signal(0);
  readonly historyMore = signal(false);
  readonly historyLoading = signal(false);
  readonly takenText = takenText;
  readonly entries = Object.entries;
  readonly form = new FormGroup({
    description: new FormControl('', { nonNullable: true, validators: Validators.maxLength(1000) }),
    takenAtLocal: new FormControl('', { nonNullable: true }),
    offset: new FormControl('', { nonNullable: true, validators: photoOffsetValidator }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)] }),
  });
  private changed = false;
  private generation = 0;
  private historySequence = 0;
  private readonly stop = new Subject<void>();
  constructor() {
    this.session.ended.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.close());
    effect(() => { if (!this.session.can('EQUIPMENT_READ')) this.close(); });
    void this.load();
  }
  private release() { this.generation++; this.stop.next(); if (this.url()) URL.revokeObjectURL(this.url()); this.url.set(''); }
  async load() {
    this.release(); const generation = this.generation; const selected = this.data.photos[this.index()];
    this.loading.set(true); this.error.set(''); this.photo.set(null); this.zoom.set(1); this.history.set([]);
    try {
      const [photo, blob] = await Promise.all([this.api.detail(this.data.asset, selected.uuid, this.stop), this.api.image(this.data.asset, selected.uuid, 'preview', this.stop)]);
      if (generation !== this.generation || !this.session.valid()) return;
      this.photo.set(photo); this.url.set(URL.createObjectURL(blob));
      this.form.reset({ description: photo.description ?? '', takenAtLocal: photo.capture.takenAtLocal ?? '', offset: offsetText(photo.capture.offsetMinutes), reason: '' });
      void this.loadHistory(0);
    } catch (error) { if (generation === this.generation) this.error.set(workspaceError(error)); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }
  async loadHistory(offset = this.historyOffset()) {
    const photo = this.photo(); if (!photo) return;
    const generation = this.generation; const sequence = ++this.historySequence; this.historyLoading.set(true); this.historyError.set('');
    try {
      const page = await this.api.history(this.data.asset, photo.uuid, offset, this.stop);
      if (generation !== this.generation || sequence !== this.historySequence) return;
      this.history.set(page.items); this.historyOffset.set(offset); this.historyMore.set(page.hasMore);
    } catch (error) { if (generation === this.generation && sequence === this.historySequence) this.historyError.set(workspaceError(error)); }
    finally { if (generation === this.generation && sequence === this.historySequence) this.historyLoading.set(false); }
  }
  move(delta: number) { const index = this.index() + delta; if (!this.busy() && index >= 0 && index < this.data.photos.length) { this.index.set(index); void this.load(); } }
  @HostListener('keydown', ['$event']) key(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.matches('input,textarea,select') || target.isContentEditable) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); this.move(event.key === 'ArrowRight' ? 1 : -1); }
  }
  private valid() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Revisa los campos e indica el motivo del cambio.');
      const selector = this.form.controls.description.invalid ? '#photo-edit-description'
        : this.form.controls.takenAtLocal.invalid ? 'tc-date-field input'
        : this.form.controls.offset.invalid ? '#photo-edit-zone' : '#photo-edit-reason';
      this.element.nativeElement.querySelector<HTMLElement>(selector)?.focus(); return false;
    }
    return true;
  }
  async save() {
    const photo = this.photo(); if (!photo || this.busy() || this.data.readOnly || !this.valid()) return;
    this.busy.set(true); this.error.set('');
    try {
      const values = this.form.getRawValue(); const zone = offsetMinutes(values.offset);
      if (zone != null && !values.takenAtLocal) throw new Error('La zona requiere una fecha de toma.');
      const saved = await this.api.correct(this.data.asset, photo.uuid, { version: photo.version, description: values.description || null,
        takenAtLocal: values.takenAtLocal || null, offsetMinutes: zone, reason: values.reason }, this.stop);
      this.photo.set(saved); this.data.photos[this.index()] = saved; this.changed = true; this.form.controls.reason.reset(); await this.loadHistory(0);
    } catch (error) { this.error.set(workspaceError(error)); }
    finally { this.busy.set(false); }
  }
  async transition() {
    const photo = this.photo(); if (!photo || this.busy() || this.data.readOnly || !this.valid()) return;
    if (!await confirm(this.dialog, photo.state === 'ACTIVE' ? 'Archivar foto' : 'Restaurar foto', 'La operación y su motivo quedarán en el historial.')) return;
    this.busy.set(true); this.error.set('');
    try {
      const saved = await this.api.transition(this.data.asset, photo, this.form.controls.reason.value, this.stop);
      this.photo.set(saved); this.data.photos[this.index()] = saved; this.changed = true; this.form.controls.reason.reset(); await this.loadHistory(0);
    } catch (error) { this.error.set(workspaceError(error)); }
    finally { this.busy.set(false); }
  }
  time(value: string) { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: this.session.context()?.company.timezone ?? 'UTC' }).format(new Date(value)); }
  action(value: string) { return ({ UPLOADED: 'Carga', CORRECTED: 'Corrección', ARCHIVED: 'Archivo', RESTORED: 'Restauración' } as Record<string, string>)[value] ?? value; }
  close() { this.ref.close(this.changed); }
  ngOnDestroy() { this.release(); this.stop.complete(); }
}
