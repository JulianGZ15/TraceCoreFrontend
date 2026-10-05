import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryForm, toInstant } from '../../page-base';

import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { CustodyEditorComponent } from '../../editors/custody-editor/custody-editor.component';

@Component({
  selector: 'tc-inventory-asset',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    InventoryNavComponent,
  ],
  templateUrl: './asset.component.html',
  styleUrl: './asset.component.scss',
})
export class AssetComponent extends InventoryForm {
  readonly profile = signal<M.Profile | null>(null);
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
    this.rows.set([]);
    this.placements.set([]);
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
        const y = p.assignment?.locationUuid
          ? (await this.api.get<M.Location>('/locations/' + p.assignment.locationUuid)).yardUuid
          : (p.transit?.sourceYardUuid ?? p.custody?.yardUuid ?? null);
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
        return { p, y, a, c };
      },
      (v) => {
        this.profile.set(v.p);
        this.currentYard.set(v.y);
        this.placements.set(v.a);
        this.custodians.set(v.c);
        this.rows.set(this.section === 'ubicacion' ? v.a : v.c);
      },
    );
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
