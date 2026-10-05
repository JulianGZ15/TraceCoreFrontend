import { Component, input, output, signal, effect, untracked } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Feedback } from '../../../../shared/ui/page';
import { InventoryPage } from '../../page-base';

@Component({
  selector: 'tc-inventory-lookup',
  imports: [FormsModule, Feedback],
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
  readonly picked = output<string>();
  readonly choices = signal<{ uuid: string; label: string; disabled: boolean }[]>([]);
  readonly cursor = signal(0);
  term = '';
  readonly selected = signal('');
  readonly selectedId = signal('');
  private signature = '';
  constructor() {
    super();
    effect(() => {
      const signature = JSON.stringify([this.kind(), this.filters()]);
      if (signature === this.signature) return;
      this.signature = signature;
      untracked(() => {
        this.cursor.set(0);
        void this.load();
      });
    });
  }
  async load() {
    const k = this.kind();
    const path = k === 'parties' ? '/party-options' : '/' + k;
    await this.request(
      () =>
        this.api.get<Record<string, unknown>[]>(path, {
          ...this.filters(),
          offset: this.cursor(),
          limit: 25,
          ...(['assets', 'parties'].includes(k) && this.term.trim()
            ? { search: this.term.trim() }
            : {}),
        }),
      (rows) =>
        this.choices.set(
          rows.map((r) => ({
            uuid: String(r['uuid']),
            label:
              String(
                r['internalCode'] ??
                  r['code'] ??
                  r['legalName'] ??
                  r['folio'] ??
                  r['rootAssetUuid'] ??
                  r['uuid'],
              ) +
              ' · ' +
              String(r['name'] ?? r['tradeName'] ?? r['state'] ?? r['uuid']),
            disabled:
              (k === 'movements' && r['type'] !== 'ADJUSTMENT') ||
              r['active'] === false ||
              r['lifecycle'] === 'RETIRED' ||
              (k === 'reservations' && r['state'] !== 'CONFIRMED'),
          })),
        ),
    );
  }
  search() {
    this.cursor.set(0);
    void this.load();
  }
  move(delta: number) {
    this.cursor.update((n) => Math.max(0, n + delta));
    void this.load();
  }
  choose(c: { uuid: string; label: string }) {
    this.selectedId.set(c.uuid);
    this.selected.set(c.label);
    this.picked.emit(c.uuid);
  }
}
