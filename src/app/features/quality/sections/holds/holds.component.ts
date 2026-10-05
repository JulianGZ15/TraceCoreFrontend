import { Component, signal, input, effect, untracked, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
import { uuidPattern } from '../../rules';
import * as M from '../../models';
import { HoldComponent } from '../../editors/hold/hold.component';
@Component({
  selector: 'tc-quality-section-holds',
  imports: [Feedback, Pagination],
  templateUrl: './holds.component.html',
  styleUrl: './holds.component.scss',
})
export class HoldsComponent extends QualityPage {
  readonly asset = input.required<M.Asset>();
  readonly rows = signal<M.Row<M.Hold>[]>([]);
  async create() {
    if (await this.editor(HoldComponent, { assetUuid: this.asset().uuid }, 'Abrir retención'))
      await this.load();
  }
  async load() {
    await this.request(
      () =>
        this.get<M.Row<M.Hold>[]>('/holds', {
          assetUuid: this.asset().uuid,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }
  constructor() {
    super();
    effect(() => {
      this.asset();
      this.stop.next();
      untracked(() => this.watch(() => this.load()));
    });
  }
  move(n: number) {
    this.page(n);
  }
  async transition(path: string, version: number, evidenceRequired = false) {
    if (
      await this.editor(
        TransitionComponent,
        { path, version, evidenceRequired },
        'Confirmar operación',
      )
    )
      await this.load();
  }
}
