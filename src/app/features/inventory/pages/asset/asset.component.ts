import { DateFieldComponent } from '../../../../shared/ui/date-field/date-field.component';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton.component';
import { DataTable } from '../../../../shared/ui/data-table/data-table.component';
import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';
import { InventoryForm, toInstant } from '../../page-base';

import * as M from '../../models';

import { CustodyEditorComponent } from '../../editors/custody-editor/custody-editor.component';
import { EntityReferenceComponent } from '../../../../shared/ui/entity-reference/entity-reference.component';

@Component({
  selector: 'tc-inventory-asset',
  imports: [
    Skeleton,
    DataTable,
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    PageNav, DateFieldComponent, EntityReferenceComponent],
  templateUrl: './asset.component.html',
  styleUrl: './asset.component.scss',
})
export class AssetComponent extends InventoryForm {
  readonly sectionItems = computed<PageNavItem[]>(() =>
    [
      ['actual', 'Situación actual'],
      ['ubicacion', 'Historial de ubicación'],
      ['custodia', 'Custodia'],
      ['disponibilidad', 'Disponibilidad'],
    ].map(([key, label]) => ({ label, route: ['/inventario/equipos', this.id(), key] })),
  );
  readonly profile = signal<M.Profile | null>(null);
  readonly currentLocation = signal<M.Location | null>(null);
  readonly rows = signal<(M.Assignment | M.Custody)[]>([]);
  readonly placements = signal<M.Assignment[]>([]);
  readonly custodians = signal<M.Custody[]>([]);
  readonly result = signal<M.Availability | null>(null);
  readonly currentYard = signal<string | null>(null);
  section = 'actual';
  readonly form = new FormGroup({
    from: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    to: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    offset: new FormControl('+00:00', { nonNullable: true }),
  });
  protected override resourceChanged() {
    super.resourceChanged();
    this.profile.set(null);
    this.currentLocation.set(null);
    this.rows.set([]);
    this.placements.set([]);
    this.locationMovements.set([]);
    this.custodians.set([]);
    this.result.set(null);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    this.result.set(null);
    this.section = this.route.snapshot.paramMap.get('section') ?? 'actual';
    await this.request(
      async () => {
        const p = await this.api.get<M.Profile>('/assets/' + this.id());
        const location = p.assignment?.locationUuid
          ? await this.api.get<M.Location>('/locations/' + p.assignment.locationUuid)
          : null;
        const y = location?.yardUuid ?? p.transit?.sourceYardUuid ?? p.custody?.yardUuid ?? null;
        const a =
          this.section === 'ubicacion'
            ? await this.api.get<M.Assignment[]>('/assets/' + this.id() + '/locations', {
                offset: this.offset(),
                limit: this.limit(),
              })
            : [];
        const c =
          this.section === 'custodia'
            ? await this.api.get<M.Custody[]>('/assets/' + this.id() + '/custody', {
                offset: this.offset(),
                limit: this.limit(),
              })
            : [];
        const movements = this.section === 'ubicacion'
          ? await this.api.get<M.LocationMovement[]>('/assets/' + this.id() + '/movements', { offset: this.offset(), limit: this.limit() })
          : [];
        return { p, y, location, a, c, movements };
      },
      (v) => {
        this.profile.set(v.p);
        this.currentYard.set(v.y);
        this.currentLocation.set(v.location);
        this.placements.set(v.a);
        this.locationMovements.set(v.movements);
        this.custodians.set(v.c);
        this.rows.set(this.section === 'ubicacion' ? v.a : v.c);
      },
    );
  }
  readonly locationMovements = signal<M.LocationMovement[]>([]);
  readonly canChangeLocation = computed(() => {
    const p = this.profile();
    const eligible = !!p && !p.transit && (p.placementState === 'YARD' || p.placementState === 'UNLOCATED') && p.custody?.mode !== 'RENTAL' && !p.custody?.partyUuid;
    return eligible && this.access.can('MOVEMENT_MANAGE', this.currentYard() ?? this.yard());
  });
  changeLocation() {
    const p = this.profile();
    if (!p || !this.canChangeLocation()) return;
    const yardUuid = this.currentYard() ?? this.yard();
    void this.router.navigate(['/inventario/movimientos/nuevo'], { queryParams: {
      yardUuid: yardUuid || null,
      type: p.placementState === 'UNLOCATED' ? 'INBOUND' : 'TRANSFER',
      destinationYardUuid: yardUuid || null,
      assetUuids: p.asset.uuid,
      internal: 'true',
    } });
  }
  async availability() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    try {
      const v = this.form.getRawValue(),
        from = toInstant(v.from, v.offset)!,
        to = toInstant(v.to, v.offset)!;
      if (Date.parse(to) <= Date.parse(from))
        throw new Error('El fin debe ser posterior al inicio.');
      await this.request(
        () => this.api.get<M.Availability>('/assets/' + this.id() + '/availability', { from, to }),
        (r) => {
          this.result.set(r);
          this.form.markAsPristine();
        },
      );
    } catch (e) {
      this.error.set(String(e));
    }
  }
  async custody() {
    if (
      await this.editor(
        CustodyEditorComponent,
        { profile: this.profile(), yardUuid: this.currentYard() },
        'Transferir custodia',
      )
    )
      await this.load();
  }
}
