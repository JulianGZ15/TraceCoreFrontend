import { Component, inject, signal, computed, OnDestroy, TemplateRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { PartnersApi } from '../../partners-api';
import { Session } from '../../../../core/auth/session';
import { errorMessage } from '../../../../core/http/api';
import {
  PageHeading,
  Feedback,
  Pagination,
  Status,
  ListContainer,
  SearchToolbar,
  FilterSection,
  openFilterDrawer,
  FilterDef,
  FilterChip,
  chipsFor,
  activeCount,
} from '../../../../shared/ui/page';
import { Party, partyRoles } from '../../models';
import { label } from '../../rules';
import { RecordEditorComponent } from '../../editors/record-editor/record-editor.component';
import { partyFields } from '../../record-fields';
import { openPartnerEditor } from '../../editor-view';

@Component({
  selector: 'tc-party-directory',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeading,
    Feedback,
    Pagination,
    Status,
    ListContainer,
    SearchToolbar,
    FilterSection,
  ],
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss',
})
export class DirectoryComponent implements OnDestroy {
  private api = inject(PartnersApi);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(Dialog);
  private fb = inject(FormBuilder);

  readonly session = inject(Session);
  readonly roles = partyRoles;
  readonly label = label;
  readonly rows = signal<Party[]>([]);
  readonly offset = signal(0);
  readonly limit = signal(25);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    search: [''],
    role: [''],
    active: [''],
  });

  readonly drawerForm = this.fb.nonNullable.group({
    role: [''],
    active: [''],
  });

  readonly filterDefs: FilterDef[] = [
    { key: 'search', label: 'Búsqueda', kind: 'primary' },
    {
      key: 'role',
      label: 'Rol vigente',
      group: 'Clasificación',
      format: (v) => label(v as (typeof partyRoles)[number]),
    },
    {
      key: 'active',
      label: 'Estado',
      group: 'Estado',
      format: (v) => (v === 'true' ? 'Activo' : v === 'false' ? 'Inactivo' : v),
    },
  ];

  readonly formValues = signal({ search: '', role: '', active: '' });
  readonly chips = computed(() => chipsFor(this.filterDefs, this.formValues()));
  readonly activeFilterCount = computed(() => activeCount(this.filterDefs, this.formValues()));

  private generation = 0;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((q) => {
      const search = (q.get('search') ?? '').slice(0, 150);
      const role = partyRoles.includes(q.get('role') as (typeof partyRoles)[number])
        ? q.get('role')!
        : '';
      const active = ['true', 'false'].includes(q.get('active') ?? '') ? q.get('active')! : '';

      this.form.reset({ search, role, active });
      this.formValues.set({ search, role, active });

      this.limit.set(
        [25, 50, 100].includes(Number(q.get('limit'))) ? Number(q.get('limit')) : 25,
      );
      const offset = Number(q.get('offset') ?? 0);
      this.offset.set(Number.isInteger(offset) && offset >= 0 ? offset : 0);
      void this.load();
    });
  }

  async load() {
    const generation = ++this.generation,
      epoch = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    this.rows.set([]);
    const v = this.form.getRawValue(),
      params: Record<string, string | number> = { offset: this.offset(), limit: this.limit() };
    for (const [key, value] of Object.entries(v)) if (value) params[key] = value;
    try {
      const rows = await this.api.directory(params);
      if (generation === this.generation && epoch === this.session.epoch()) this.rows.set(rows);
    } catch (e) {
      if (generation === this.generation) this.error.set(errorMessage(e));
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }

  apply(offset = 0, limit = this.limit()) {
    const v = this.form.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: v.search || null,
        role: v.role || null,
        active: v.active || null,
        offset,
        limit,
      },
    });
  }

  onSearch(term: string) {
    this.form.patchValue({ search: term });
    this.apply();
  }

  onRemoveChip(chip: FilterChip) {
    for (const k of chip.keys) {
      this.form.patchValue({ [k]: '' });
    }
    this.apply();
  }

  onClearAll() {
    this.form.patchValue({ role: '', active: '' });
    this.apply();
  }

  async openFilters(template: TemplateRef<unknown>) {
    const cur = this.form.getRawValue();
    this.drawerForm.reset({
      role: cur.role,
      active: cur.active,
    });

    await openFilterDrawer(this.dialog, {
      title: 'Filtros de terceros',
      subtitle: 'Clasificación y estado en el directorio',
      template,
      onApply: () => {
        const draft = this.drawerForm.getRawValue();
        this.form.patchValue({
          role: draft.role,
          active: draft.active,
        });
        this.apply();
      },
      onClear: () => {
        this.drawerForm.reset({ role: '', active: '' });
      },
    });
  }

  async create() {
    if (!this.session.can('PARTY_MANAGE')) return;
    const row = await openPartnerEditor(this.dialog, RecordEditorComponent, {
      title: 'Nuevo tercero',
      party: '',
      fields: partyFields,
      initial: { country: 'MX', active: true },
    });
    if (row && this.session.valid())
      void this.router.navigate(['/terceros', (row as Party).uuid, 'general']);
  }

  ngOnDestroy() {
    ++this.generation;
    this.rows.set([]);
  }
}
