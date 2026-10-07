import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { WorkspaceApi } from '../../../../core/http/workspace-api';
import { Feedback } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
import { SubjectPickerComponent } from '../../shared/subject-picker/subject-picker.component';
import {
  subjectKinds,
  subjectNames,
  documentTypes,
  SubjectKind,
  SubjectOption,
  Document,
} from '../../models';
import { DocumentPending, PendingDocument, definiteFailure } from '../../pending';
import { uuidPattern } from '../../rules';
@Component({
  selector: 'tc-document-editor',
  imports: [ReactiveFormsModule, Feedback, SubjectPickerComponent],
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.scss',
})
export class DocumentEditorComponent {
  readonly api = inject(WorkspaceApi);
  readonly ref = inject(DialogRef<Document>);
  readonly data = inject<{ kind?: SubjectKind; uuid?: string }>(DIALOG_DATA, { optional: true });
  readonly pending = inject(DocumentPending);
  readonly kinds = subjectKinds;
  readonly names = subjectNames;
  readonly types = documentTypes;
  readonly busy = signal(false);
  readonly error = signal('');
  private request?: PendingDocument;
  readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(250)]],
    type: ['GENERAL', Validators.required],
    classification: ['INTERNAL', Validators.required],
    ownerKind: [this.data?.kind ?? 'PARTY', Validators.required],
    ownerUuid: [this.data?.uuid ?? '', [Validators.required, Validators.pattern(uuidPattern)]],
  });
  select(row: SubjectOption) {
    this.form.controls.ownerUuid.setValue(row.uuid);
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
    const values = this.form.getRawValue();
    if (
      values.classification === 'CONFIDENTIAL' &&
      !this.api.session.can('DOCUMENT_CONFIDENTIAL')
    ) {
      this.error.set('Necesitas DOCUMENT_CONFIDENTIAL COMPANY.');
      return;
    }
    if (this.request) {
      this.error.set('Consulta o repite la solicitud pendiente antes de crear otra.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      this.request = this.pending.track('CREATE', '/documents', {
        uuid: crypto.randomUUID(),
        ...values,
      });
      const result = (await this.pending.repeat(this.request)) as Document;
      this.ref.close(result);
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
      const r = (await this.pending.recover(this.request)) as { document: Document };
      this.ref.close(r.document);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  async repeat() {
    if (!this.request) return;
    this.busy.set(true);
    try {
      const r = (await this.pending.repeat(this.request)) as Document;
      this.ref.close(r);
    } catch (e) {
      if (this.request && definiteFailure(e)) this.request = undefined;
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
