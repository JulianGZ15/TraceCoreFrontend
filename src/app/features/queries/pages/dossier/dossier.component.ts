import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback, Pagination, PageNav, PageNavItem } from '../../../../shared/ui/page';
import { RecordValuesComponent } from '../../../../shared/ui/record-values/record-values.component';
import { Page } from '../../../../core/http/workspace-api';
import { Summary, Section, equipmentSections, partySections } from '../../models';
import { QueryAccess } from '../../access';
import { CsvDownload } from '../../csv';
@Component({
  selector: 'tc-query-dossier',
  imports: [RouterLink, PageHeading, Feedback, Pagination, RecordValuesComponent, PageNav],
  templateUrl: './dossier.component.html',
  styleUrl: './dossier.component.scss',
})
export class DossierComponent extends ReadPage {
  readonly access = inject(QueryAccess);
  readonly summary = signal<Summary | null>(null);
  readonly section = signal<Section | null>(null);
  readonly csv = new CsvDownload(this.api);
  readonly page = signal<Page<unknown> | null>(null);
  uuid = '';
  equipment = true;
  selected = 'resumen';
  collection = '';
  readonly entries = Object.entries;
  sections() {
    return this.equipment ? equipmentSections : partySections;
  }
  visible() {
    return this.entries(this.sections()).filter(
      ([key, s]) => key === 'resumen' || this.summary()?.sections[s.backend],
    );
  }
  navItems(): PageNavItem[] {
    const kind = this.equipment ? 'equipos' : 'terceros';
    return this.visible().map(([key, s]) => ({
      label: s.label,
      route: `/consultas/${kind}/${this.uuid}/${key}`,
    }));
  }
  collections() {
    return this.entries(this.sections()[this.selected]?.collections ?? {});
  }
  override async load() {
    this.uuid = this.route.snapshot.paramMap.get('uuid') ?? '';
    this.equipment = this.route.snapshot.data['entity'] === 'equipment';
    this.selected = this.route.snapshot.paramMap.get('seccion') ?? 'resumen';
    this.collection = this.route.snapshot.queryParamMap.get('collection') ?? '';
    this.csv.reset();
    this.section.set(null);
    this.page.set(null);
    await this.read(
      async () => {
        const selected = this.sections()[this.selected];
        if (!selected) throw new Error('Sección desconocida.');
        if (this.collection && !selected.collections[this.collection])
          throw new Error('Colección desconocida.');
        const root = '/queries/' + (this.equipment ? 'equipment' : 'parties') + '/' + this.uuid;
        const summary = await this.api.get<Summary>(root + '/summary', {}, this.stop);
        const section = selected.backend
          ? await this.api.get<Section>(
              root + '/sections/' + selected.backend,
              { collection: this.collection, offset: this.offset, limit: this.limit },
              this.stop,
            )
          : null;
        return { summary, section };
      },
      (r) => {
        this.summary.set(r.summary);
        this.section.set(r.section);
        const data = r.section?.data;
        if (data && typeof data === 'object' && 'items' in data)
          this.page.set(data as Page<unknown>);
      },
    );
  }
  override clear() {
    this.summary.set(null);
    this.section.set(null);
    this.page.set(null);
    this.csv.reset();
  }
  selectCollection(collection: string) {
    void this.change({ collection, offset: 0 });
  }
  links() {
    if (!this.summary()) return '';
    if (this.equipment) return this.session.can('EQUIPMENT_READ') ? '/equipos/' + this.uuid : '';
    return this.session.can('PARTY_READ') ? '/terceros/' + this.uuid : '';
  }
  balances() {
    const s = this.section();
    return !this.equipment &&
      this.selected === 'finanzas' &&
      s?.authorized &&
      s.data &&
      typeof s.data === 'object' &&
      'balances' in s.data
      ? (s.data as { balances: { currency: string }[] }).balances
      : [];
  }
  exportBalance(currency: string) {
    void this.csv.download('/queries/exports/balance.csv', { partyUuid: this.uuid, currency });
  }
  override ngOnDestroy() {
    this.csv.destroy();
    super.ngOnDestroy();
  }
}
