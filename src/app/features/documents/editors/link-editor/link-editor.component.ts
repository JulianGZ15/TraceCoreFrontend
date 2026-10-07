import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { WorkspaceApi } from '../../../../core/http/workspace-api';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
import { SubjectPickerComponent } from '../../shared/subject-picker/subject-picker.component';
import { Summary, VersionView, SubjectOption, subjectKinds, subjectNames } from '../../models';
import { uuidPattern } from '../../rules';
import { toInstant } from '../../../access/assignment-time';
import { DocumentPending, PendingDocument, definiteFailure } from '../../pending';
@Component({
  selector: 'tc-document-link-editor',
  imports: [ReactiveFormsModule, Feedback, Pagination, SubjectPickerComponent],
  templateUrl: './link-editor.component.html',
  styleUrl: './link-editor.component.scss',
})
export class LinkEditorComponent {
  readonly api = inject(WorkspaceApi);
  readonly data = inject<Summary>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  readonly pending = inject(DocumentPending);
  readonly names = subjectNames;
  readonly kinds = subjectKinds;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly versions = signal<VersionView[]>([]);
  readonly chosenVersion = signal<VersionView | null>(this.data.current);
  readonly hasMore = signal(false);
  offset = 0;
  private request?: PendingDocument;
  readonly form = inject(FormBuilder).nonNullable.group({
    versionUuid: [
      this.data.current?.metadata.uuid ?? '',
      [Validators.required, Validators.pattern(uuidPattern)],
    ],
    subjectKind: [this.data.document.owner.kind, Validators.required],
    subjectUuid: [
      this.data.document.owner.uuid,
      [Validators.required, Validators.pattern(uuidPattern)],
    ],
    role: ['SUPPORT', [Validators.required, Validators.maxLength(80)]],
    validFrom: ['', Validators.required],
    validTo: [''],
    offset: ['+00:00', Validators.required],
  });
  constructor() {
    void this.load();
  }
  async load() {
    try {
      const r = await this.api.get<{ versions: VersionView[]; hasMore: boolean }>(
        '/documents/' + this.data.document.uuid,
        { offset: this.offset, limit: 25 },
      );
      this.versions.set(r.versions.filter((v) => v.metadata.state === 'APPROVED'));
      this.hasMore.set(r.hasMore);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  preserveVersion() {
    const id = this.form.controls.versionUuid.value;
    this.chosenVersion.set(
      this.versions().find((v) => v.metadata.uuid === id) ??
        (this.data.current?.metadata.uuid === id ? this.data.current : null),
    );
  }
  pinnedVersion() {
    const v = this.chosenVersion();
    return v &&
      v.metadata.uuid !== this.data.current?.metadata.uuid &&
      !this.versions().some((row) => row.metadata.uuid === v.metadata.uuid)
      ? v
      : null;
  }
  move(offset: number) {
    this.offset = offset;
    void this.load();
  }
  select(row: SubjectOption) {
    this.form.controls.subjectUuid.setValue(row.uuid);
    this.form.markAsDirty();
  }
  close() {
    if (
      !this.busy() &&
      (!this.form.dirty ||
        !this.api.session.valid() ||
        window.confirm('¿Descartar los cambios sin guardar?'))
    )
      this.ref.close();
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (this.request)
        throw new Error('Consulta o repite la solicitud pendiente antes de cambiarla.');
      const f = this.form.getRawValue(),
        validFrom = toInstant(f.validFrom, f.offset),
        validTo = toInstant(f.validTo, f.offset);
      if (!validFrom || (validTo && Date.parse(validTo) <= Date.parse(validFrom)))
        throw new Error('El fin debe ser posterior al inicio.');
      this.request = this.pending.track('LINK', '/documents/links', {
        uuid: crypto.randomUUID(),
        versionUuid: f.versionUuid,
        subjectKind: f.subjectKind,
        subjectUuid: f.subjectUuid,
        role: f.role,
        validFrom,
        validTo,
      });
      this.ref.close(await this.pending.repeat(this.request));
    } catch (e) {
      if (this.request && definiteFailure(e)) this.request = undefined;
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async recover() {
    if (!this.request) return;
    try {
      this.ref.close(await this.pending.recover(this.request));
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  async repeat() {
    if (!this.request) return;
    this.busy.set(true);
    try {
      this.ref.close(await this.pending.repeat(this.request));
    } catch (e) {
      if (this.request && definiteFailure(e)) this.request = undefined;
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
