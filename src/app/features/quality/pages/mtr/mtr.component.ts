import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Component, signal, input, effect, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
import { uuidPattern } from '../../rules';
import * as M from '../../models';
import { MtrComponent as MtrEditor } from '../../editors/mtr/mtr.component';
import { OptionPickerComponent } from '../../selectors/option-picker/option-picker.component';
@Component({
  selector: 'tc-quality-mtr',
  imports: [
    FormsModule,
    PageHeading,
    Feedback,
    QualityNavComponent,
    PendingRequestsComponent,
    OptionPickerComponent,
  ],
  templateUrl: './mtr.component.html',
  styleUrl: './mtr.component.scss',
})
export class MtrComponent extends QualityPage {
  readonly record = signal<M.Mtr | null>(null);
  readonly heats = signal<M.Link[]>([]);
  readonly assets = signal<M.Link[]>([]);
  readonly heat = new FormControl('', [Validators.required, Validators.pattern(uuidPattern)]);
  readonly asset = new FormControl('', [Validators.required, Validators.pattern(uuidPattern)]);
  readonly trace = new FormControl('', Validators.pattern(uuidPattern));
  readonly destroyRef = inject(DestroyRef);
  readonly form = new FormGroup({ heat: this.heat, asset: this.asset, trace: this.trace });
  protected override clear() {
    this.form?.reset();
  }
  ngOnInit() {
    this.asset.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.trace.reset(''));
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      async () => ({
        r: await this.get<M.Mtr>('/mtrs/' + this.id()),
        h: await this.get<M.Link[]>('/mtrs/' + this.id() + '/heats'),
        a: await this.get<M.Link[]>('/mtrs/' + this.id() + '/assets'),
      }),
      (x) => {
        this.record.set(x.r);
        this.heats.set(x.h);
        this.assets.set(x.a);
      },
    );
  }
  async edit() {
    if (await this.editor(MtrEditor, { record: this.record() }, 'Corregir MTR')) await this.load();
  }
  async transition(action: string, approved?: boolean) {
    const r = this.record();
    if (!r) return;
    if (
      await this.editor(
        TransitionComponent,
        { path: '/mtrs/' + r.uuid + '/' + action, version: r.version, approved },
        'Revisión del MTR',
      )
    )
      await this.load();
  }
  async link(kind: 'heats' | 'assets') {
    const r = this.record();
    if (!r) return;
    const selected = kind === 'heats' ? this.heat : this.asset;
    selected.markAsTouched();
    if (selected.invalid) {
      this.error.set('Selecciona un destino válido.');
      return;
    }
    if (this.trace.value && !uuidPattern.test(this.trace.value)) {
      this.error.set('La traza requiere UUID válido.');
      return;
    }
    const body =
      kind === 'heats'
        ? { heatUuid: this.heat.value, mtrVersion: r.version }
        : {
            assetUuid: this.asset.value,
            materialTraceUuid: this.trace.value || null,
            mtrVersion: r.version,
          };
    await this.mutate(
      () => this.api.post('/mtrs/' + r.uuid + '/' + kind, body),
      async () => {
        selected.reset('');
        this.trace.reset('');
        await this.load();
      },
    );
  }
  async withdraw(kind: string, link: M.Link) {
    const r = this.record();
    if (!r) return;
    if (
      await this.editor(
        TransitionComponent,
        {
          path: '/mtrs/' + r.uuid + '/' + kind + '/' + link.uuid + '/withdraw',
          version: link.version,
          mtrVersion: r.version,
        },
        'Retirar vínculo erróneo',
      )
    )
      await this.load();
  }
}
