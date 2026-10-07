import { Component, inject, signal, computed, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { ReadPage } from '../../../../shared/ui/read-page';
import {
  PageHeading,
  Feedback,
  Pagination,
  ListContainer,
  SearchToolbar,
  FilterSection,
  openFilterDrawer,
  FilterDef,
  FilterChip,
  chipsFor,
  activeCount,
} from '../../../../shared/ui/page';
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
    ListContainer,
    SubjectPickerComponent,
    SearchToolbar,
    FilterSection,
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

  readonly drawerForm = new FormGroup({
    type: new FormControl('', { nonNullable: true }),
    classification: new FormControl('', { nonNullable: true }),
    state: new FormControl('ACTIVE', { nonNullable: true }),
    ownerKind: new FormControl('', { nonNullable: true }),
    ownerUuid: new FormControl('', { nonNullable: true }),
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'type', label: 'Tipo' },
    {
      key: 'classification',
      label: 'Clasificación',
      format: (v) => (v === 'CONFIDENTIAL' ? 'Confidencial' : v === 'INTERNAL' ? 'Interno' : v),
    },
    {
      key: 'state',
      label: 'Estado',
      format: (v) => (v === 'ARCHIVED' ? 'Archivado' : v === '' ? 'Todos' : v),
    },
    {
      key: 'ownerKind',
      label: 'Propietario',
      format: (v) => this.names[v as SubjectKind] ?? v,
    },
    {
      key: 'ownerUuid',
      label: 'UUID prop.',
    },
  ];

  readonly currentFilterValues = signal<Record<string, string>>({});
  readonly chips = computed(() => chipsFor(this.filterDefs, this.currentFilterValues()));
  readonly activeFilterCount = computed(() =>
    activeCount(this.filterDefs, this.currentFilterValues()),
  );

  override async load() {
    const q = this.route.snapshot.queryParamMap;
    const s = q.get('search') ?? '';
    const t = q.get('type') ?? '';
    const c = q.get('classification') ?? '';
    const st = q.get('state') ?? 'ACTIVE';
    const ok = q.get('ownerKind') ?? '';
    const ou = q.get('ownerUuid') ?? '';

    this.form.patchValue({
      search: s,
      type: t,
      classification: c,
      state: st,
      ownerKind: ok,
      ownerUuid: ou,
    });

    const filterObj: Record<string, string> = {};
    if (t) filterObj['type'] = t;
    if (c) filterObj['classification'] = c;
    if (st && st !== 'ACTIVE') filterObj['state'] = st;
    if (ok) filterObj['ownerKind'] = ok;
    if (ou) filterObj['ownerUuid'] = ou;
    this.currentFilterValues.set(filterObj);

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

  onSearch(term: string) {
    void this.change({ search: term.trim() || null, offset: 0 });
  }

  onRemoveChip(chip: FilterChip) {
    const patch: Record<string, string | null> = { offset: '0' };
    for (const k of chip.keys) {
      patch[k] = null;
    }
    void this.change(patch);
  }

  onClearAll() {
    void this.change({
      search: null,
      type: null,
      classification: null,
      state: null,
      ownerKind: null,
      ownerUuid: null,
      offset: 0,
    });
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.form.getRawValue();
    this.drawerForm.reset({
      type: cur.type,
      classification: cur.classification,
      state: cur.state,
      ownerKind: cur.ownerKind,
      ownerUuid: cur.ownerUuid,
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de documentos',
      subtitle: 'Tipo, clasificación, estado y propietario',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        if (!!draft.ownerKind !== !!draft.ownerUuid) {
          this.error.set('Selecciona tipo y UUID del propietario, o limpia ambos.');
          return;
        }
        void this.change({
          type: draft.type || null,
          classification: draft.classification || null,
          state: draft.state || null,
          ownerKind: draft.ownerKind || null,
          ownerUuid: draft.ownerUuid || null,
          offset: 0,
        });
      },
      onClear: () => {
        this.drawerForm.reset({
          type: '',
          classification: '',
          state: 'ACTIVE',
          ownerKind: '',
          ownerUuid: '',
        });
      },
    });
  }

  setDraftClassification(val: string) {
    this.drawerForm.controls.classification.setValue(val);
  }

  setDraftState(val: string) {
    this.drawerForm.controls.state.setValue(val);
  }

  drawerKind() {
    return this.drawerForm.controls.ownerKind.value as SubjectKind;
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
