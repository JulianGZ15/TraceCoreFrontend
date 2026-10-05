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

@Component({
  selector: 'tc-quality-section-inspections',
  imports: [RouterLink, Feedback, Pagination],
  templateUrl: './inspections.component.html',
  styleUrl: './inspections.component.scss',
})
export class InspectionsComponent extends QualityPage {
  readonly asset = input.required<M.Asset>();
  readonly rows = signal<M.Row<M.Inspection>[]>([]);
  async create() {
    void this.router.navigate(['/calidad/inspecciones/nueva'], {
      queryParams: { assetUuid: this.asset().uuid },
    });
  }
  async load() {
    await this.request(
      () =>
        this.get<M.Row<M.Inspection>[]>('/inspections', {
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
