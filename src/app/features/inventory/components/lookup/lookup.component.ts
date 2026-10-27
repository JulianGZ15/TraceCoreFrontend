import { Component, input, output, signal, effect, untracked, computed } from '@angular/core';

import { Feedback } from '../../../../shared/ui/page';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
import { InventoryPage } from '../../page-base';

@Component({
  selector: 'tc-inventory-lookup',
  imports: [Feedback, EntitySearchComponent],
  templateUrl: './lookup.component.html',
  styleUrl: './lookup.component.scss',
})
export class LookupComponent extends InventoryPage {
  readonly kind = input.required<
    'assets' | 'locations' | 'sites' | 'parties' | 'reservations' | 'movements'
  >();
  readonly filters = input<Record<string, string | number | boolean | null | undefined>>({});
  readonly value = input('');
  readonly title = input('Seleccionar');
  readonly eligibleOnly = input(false);
  readonly picked = output<string>();
  readonly choices = signal<{ uuid: string; label: string; disabled: boolean }[]>([]);
  readonly suggestions = computed(() => this.choices().map((choice) => ({ value: choice.uuid, label: choice.label, disabled: choice.disabled })));
  readonly selected = signal('');
  readonly selectedId = signal('');
  private signature = '';
  private searchSequence = 0;
  constructor() {
    super();
    effect(() => {
      const value = this.value();
      this.selectedId.set(value);
      if (!value) this.selected.set('');
    });
    effect(() => {
      const signature = JSON.stringify([this.kind(), this.filters()]);
      if (signature === this.signature) return;
      this.signature = signature;
      untracked(() => {
        void this.load('');
      });
    });
  }
  readonly searchOptions = (query: string): Promise<EntityOption[]> => this.load(query);

  async load(query = ''): Promise<EntityOption[]> {
    const k = this.kind();
    const unlocatedForYard = k === 'assets' ? this.filters()['unlocatedForYard'] : null;
    const path = k === 'parties' ? '/party-options' : k === 'assets' && unlocatedForYard ? '/assets/unlocated' : '/' + k;
    const filters = { ...this.filters() };
    delete filters['unlocatedForYard'];
    if (unlocatedForYard) filters['yardUuid'] = unlocatedForYard as string;
    const request = ++this.searchSequence;
    const epoch = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.get<Record<string, unknown>[]>(path, {
        ...filters,
        offset: 0,
        limit: 25,
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      if (!this.alive || request !== this.searchSequence || epoch !== this.session.epoch()) return [];
      const choices = rows.map((r) => ({
            uuid: String(r['uuid']),
            label:
              String(
                r['internalCode'] ??
                  r['code'] ??
                  r['legalName'] ??
                  r['folio'] ??
                  r['rootAssetUuid'] ??
                  'Registro disponible',
              ) +
              ' · ' +
              String(r['name'] ?? r['tradeName'] ?? r['state'] ?? 'Registro disponible'),
            disabled:
              (k === 'movements' && r['type'] !== 'ADJUSTMENT') ||
              (k === 'assets' && this.eligibleOnly() && r['internalMoveEligible'] !== true) ||
              r['active'] === false ||
              r['lifecycle'] === 'RETIRED' ||
              (k === 'reservations' && r['state'] !== 'CONFIRMED'),
          }));
      this.choices.set(choices);
      if (this.selectedId()) this.selected.set(choices.find((c) => c.uuid === this.selectedId())?.label ?? 'Registro seleccionado');
      return this.suggestions();
    } catch (error) {
      if (request === this.searchSequence) this.error.set(error instanceof Error ? error.message : 'No se pudieron consultar las opciones.');
      return [];
    } finally {
      if (request === this.searchSequence) this.busy.set(false);
    }
  }
  choose(c: EntityOption | null) {
    this.selectedId.set(c?.value ?? '');
    this.selected.set(c?.label ?? '');
    this.picked.emit(c?.value ?? '');
  }
}
