import { Component, inject, input, signal, effect, untracked } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, AbstractControl } from '@angular/forms';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import * as M from '../../models';
@Component({
  selector: 'tc-quality-option',
  imports: [ReactiveFormsModule, FormsModule, Feedback, Pagination],
  templateUrl: './option-picker.component.html',
  styleUrl: './option-picker.component.scss',
})
export class OptionPickerComponent extends QualityPage {
  get field() {
    return this.control() as FormControl;
  }
  readonly control = input.required<AbstractControl>();
  readonly kind = input.required<string>();
  readonly assetUuid = input('');
  readonly title = input.required<string>();
  readonly nullable = input(false);
  readonly rows = signal<M.Option[]>([]);
  readonly selected = signal('');
  search = '';
  constructor() {
    super();
    effect(() => {
      this.kind();
      this.assetUuid();
      this.offset.set(0);
      this.stop.next();
      this.generation++;
      untracked(() => void this.load());
    });
  }
  select(v: M.Option) {
    this.control().setValue(v.uuid);
    this.control().markAsDirty();
    this.selected.set(v.label);
  }
  unset() {
    this.control().setValue('');
    this.control().markAsDirty();
    this.selected.set('');
  }
  move(n: number) {
    this.offset.set(n);
    void this.load();
  }
  async load() {
    const kind = this.kind();
    let path = '/catalog-options',
      params: Record<string, string | number | null> = {
        kind,
        search: this.search,
        offset: this.offset(),
        limit: this.limit(),
        assetUuid: this.assetUuid() || null,
      };
    if (['PARTY', 'USER', 'WORKSHOP'].includes(kind)) {
      path = '/' + kind.toLowerCase() + '-options';
      delete params['kind'];
    }
    if (kind === 'ASSET') {
      path = '/assets';
      delete params['kind'];
      delete params['assetUuid'];
    }
    if (kind === 'TRACE') {
      if (!this.assetUuid()) {
        this.rows.set([]);
        return;
      }
      path = '/assets/' + this.assetUuid() + '/material-traces';
      params = { offset: this.offset(), limit: this.limit() };
    }
    if (kind === 'STANDARD') {
      if (!this.access.global('QUALITY_READ')) {
        this.rows.set([]);
        return;
      }
      path = '/standards';
      delete params['kind'];
      delete params['search'];
      delete params['assetUuid'];
    }
    if (kind === 'POLICY') {
      if (!this.assetUuid()) {
        this.rows.set([]);
        return;
      }
      path = '/assets/' + this.assetUuid() + '/applicable-policies';
      params = {};
    }
    await this.request(
      () => this.get<(M.Option | M.Asset | M.Standard | M.Policy | M.Trace)[]>(path, params),
      (rows) =>
        this.rows.set(
          rows.map((v) => ({
            uuid: v.uuid,
            label:
              'label' in v
                ? v.label
                : 'position' in v
                  ? v.position + ' · ' + v.heatNumber
                  : 'internalCode' in v
                    ? v.internalCode + ' · ' + (v.serialNumber ?? 'Sin serial')
                    : 'method' in v
                      ? v.method + ' · ' + v.revision
                      : v.code + ' · ' + v.edition,
            code: 'code' in v ? v.code : '',
          })),
        ),
    );
  }
}
