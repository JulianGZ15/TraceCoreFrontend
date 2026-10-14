import { Component, input, signal, effect } from '@angular/core';
import { FormControl, AbstractControl } from '@angular/forms';
import { EntitySearchComponent, EntityOption } from '../../../../shared/ui/entity-search/entity-search.component';
import { Feedback } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import * as M from '../../models';
@Component({
  selector: 'tc-quality-option',
  imports: [Feedback, EntitySearchComponent],
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
  readonly selected = signal('');
  readonly searchFn = (query: string) => this.searchOptions(query);
  constructor() {
    super();
    effect(() => {
      this.kind();
      this.assetUuid();
      this.selected.set('');
    });
  }
  select(v: EntityOption | null) {
    this.control().setValue(v?.value ?? '');
    this.control().markAsDirty();
    this.selected.set(v?.label ?? '');
  }
  unset() {
    this.control().setValue('');
    this.control().markAsDirty();
    this.selected.set('');
  }
  async searchOptions(search: string): Promise<EntityOption[]> {
    const kind = this.kind();
    let path = '/catalog-options',
      params: Record<string, string | number | null> = {
        kind,
        search,
        offset: 0,
        limit: 25,
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
      params['search'] = search;
    }
    if (kind === 'TRACE') {
      if (!this.assetUuid()) {
        return [];
      }
      path = '/assets/' + this.assetUuid() + '/material-traces';
      params = { search, offset: 0, limit: 25 };
    }
    if (kind === 'STANDARD') {
      if (!this.access.global('QUALITY_READ')) {
        return [];
      }
      path = '/catalog-options';
      params['kind'] = 'STANDARD';
      params['search'] = search;
      delete params['assetUuid'];
    }
    if (kind === 'POLICY') {
      if (!this.assetUuid()) {
        return [];
      }
      path = '/assets/' + this.assetUuid() + '/applicable-policies';
      params = {};
    }
    try {
      const rows = await this.get<(M.Option | M.Asset | M.Standard | M.Policy | M.Trace)[]>(path, params);
      const filtered = kind === 'POLICY'
        ? rows.filter((v) => `${'method' in v ? v.method : ''} ${'revision' in v ? v.revision : ''}`.toLowerCase().includes(search.toLowerCase()))
        : rows;
      return filtered.slice(0, 25).map((v) => ({
        value: v.uuid,
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
        meta: 'code' in v ? v.code : undefined,
      }));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las opciones.');
      return [];
    }
  }
}
