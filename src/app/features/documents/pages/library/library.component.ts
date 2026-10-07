import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { Page } from '../../../../core/http/workspace-api';
import {
  DocumentRow,
  subjectKinds,
  subjectNames,
  documentTypes,
  SubjectKind,
  Summary,
} from '../../models';
import { DocumentEditorComponent } from '../../editors/document-editor/document-editor.component';
import { UploadEditorComponent } from '../../editors/upload-editor/upload-editor.component';
import { SubjectPickerComponent } from '../../shared/subject-picker/subject-picker.component';
import { DocumentPending, PendingDocument } from '../../pending';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
@Component({
  selector: 'tc-document-library',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    SubjectPickerComponent,
  ],
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss',
})
export class LibraryComponent extends ReadPage {
  readonly dialog = inject(Dialog);
  readonly pending = inject(DocumentPending);
  readonly rows = signal<DocumentRow[]>([]);
  readonly hasMore = signal(false);
  readonly kinds = subjectKinds;
  readonly names = subjectNames;
  readonly types = documentTypes;
  readonly form = inject(FormBuilder).nonNullable.group({
    search: [''],
    type: [''],
    classification: [''],
    state: ['ACTIVE'],
    ownerKind: [''],
    ownerUuid: [''],
  });
  override async load() {
    const q = this.route.snapshot.queryParamMap;
    this.form.patchValue({
      search: q.get('search') ?? '',
      type: q.get('type') ?? '',
      classification: q.get('classification') ?? '',
      state: q.get('state') ?? 'ACTIVE',
      ownerKind: q.get('ownerKind') ?? '',
      ownerUuid: q.get('ownerUuid') ?? '',
    });
    await this.read(
      () =>
        this.api.get<Page<DocumentRow>>(
          '/documents/directory',
          { ...this.form.getRawValue(), offset: this.offset, limit: this.limit },
          this.stop,
        ),
      (r) => {
        this.rows.set(r.items);
        this.hasMore.set(r.hasMore);
      },
    );
  }
  override clear() {
    this.rows.set([]);
  }
  apply() {
    const f = this.form.getRawValue();
    if (!!f.ownerKind !== !!f.ownerUuid) {
      this.error.set('Selecciona tipo y UUID del propietario, o limpia ambos.');
      return;
    }
    void this.change({ ...f, offset: 0 });
  }
  kind() {
    return this.form.controls.ownerKind.value as SubjectKind;
  }
  create() {
    this.dialog
      .open(DocumentEditorComponent, {
        data: {
          kind: this.form.controls.ownerKind.value || undefined,
          uuid: this.form.controls.ownerUuid.value || undefined,
        },
        width: '760px',
        maxWidth: 'calc(100vw - 32px)',
        disableClose: true,
        ariaLabel: 'Nuevo documento',
      })
      .closed.subscribe((result) => {
        if (result && typeof result === 'object' && 'uuid' in result)
          void this.router.navigate(['/documentos', result.uuid]);
      });
  }
  async recover(row: PendingDocument) {
    try {
      const r = (await this.pending.recover(row)) as any;
      const id = r.document?.uuid ?? r.metadata?.documentUuid ?? r.view?.document?.uuid;
      this.notice.set('Resultado recuperado sin otra escritura.');
      if (id) void this.router.navigate(['/documentos', id]);
      else await this.load();
    } catch (e) {
      this.error.set(errorMessage(e) + ' Un 404 no confirma ausencia de guardado.');
    }
  }
  async repeat(row: PendingDocument) {
    try {
      if (row.operation === 'UPLOAD') {
        const id = row.path.split('/')[2],
          summary = await this.api.get<Summary>('/documents/' + id + '/summary');
        this.dialog
          .open(UploadEditorComponent, {
            data: { summary, mode: 'UPLOAD', pending: row },
            width: '760px',
            maxWidth: 'calc(100vw - 32px)',
            disableClose: true,
            ariaLabel: 'Retomar carga pendiente',
          })
          .closed.subscribe(() => void this.load());
      } else {
        await this.pending.repeat(row);
        await this.load();
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
