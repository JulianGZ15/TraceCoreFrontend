import { Component, inject, OnDestroy, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { InventoryPage } from '../../page-base';
import * as M from '../../models';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { LookupComponent } from '../../components/lookup/lookup.component';
import { createIdentifierCodes } from '../../identifier-codes';
import { Api } from '../../../../core/http/api';

@Component({
  selector: 'tc-inventory-identifiers',
  imports: [PageHeading, Feedback, YardPickerComponent, InventoryNavComponent, LookupComponent, RouterLink],
  templateUrl: './identifiers.component.html',
  styleUrl: './identifiers.component.scss',
})
export class IdentifiersComponent extends InventoryPage implements OnDestroy {
  readonly rows = signal<M.AssetRow[]>([]);
  readonly selected = signal(new Set<string>());
  readonly labels = signal<M.IdentifierLabel[]>([]);
  search = '';
  locationUuid = '';

  constructor() {
    super();
  }

  override ngOnDestroy() {
    this.releaseCodeUrls();
    super.ngOnDestroy();
  }

  private readonly coreApi = inject(Api);

  ngOnInit() {
    this.watch(async () => {
      this.search = this.route.snapshot.queryParamMap.get('search') ?? '';
      this.locationUuid = this.route.snapshot.queryParamMap.get('locationUuid') ?? '';
      const preselected = this.route.snapshot.queryParamMap.get('assetUuid');
      if (preselected) this.selected.set(new Set([...this.selected(), preselected]));
      await this.load();
    });
  }

  async load() {
    this.labels.set([]);
    await this.request(
      () => this.api.get<M.AssetRow[]>('/assets', this.params({ search: this.search || null, locationUuid: this.locationUuid || null, limit: 100, offset: 0 })),
      (rows) => this.rows.set(rows),
    );
  }

  setLocation(uuid: string) {
    this.locationUuid = uuid;
    this.selected.set(new Set());
    void this.load();
  }

  toggle(row: M.AssetRow, checked: boolean) {
    const selected = new Set(this.selected());
    if (checked && selected.size < 100) selected.add(row.uuid);
    else if (!checked) selected.delete(row.uuid);
    this.selected.set(selected);
  }

  async generate() {
    this.releaseCodeUrls();
    this.labels.set([]);
    const ids = [...this.selected()].slice(0, 100);
    if (!ids.length) {
      this.error.set('Selecciona al menos un activo.');
      return;
    }
    await this.request(async () => {
      const [rows, logo] = await Promise.all([
        this.api.post<M.IdentifierAsset[]>('/assets/identifiers', { assetUuids: ids }),
        this.logoDataUrl(),
      ]);
      return { rows, logo };
    }, ({ rows, logo }) => {
      this.labels.set(rows.map((asset) => ({ asset, ...createIdentifierCodes(asset.uuid, logo ?? undefined) })));
    });
  }

  private async logoDataUrl(): Promise<string | null> {
    try {
      const blob = await this.coreApi.getBlob('/company/logo');
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Logo image could not be read'));
        reader.onerror = () => reject(reader.error ?? new Error('Logo image could not be read'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return null;
      throw error;
    }
  }

  clearSelection() {
    this.releaseCodeUrls();
    this.selected.set(new Set());
    this.labels.set([]);
  }

  downloadName(label: M.IdentifierLabel, kind: 'qr' | 'barcode') {
    const code = label.asset.internalCode.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || label.asset.uuid;
    return `${code}-${kind === 'qr' ? 'qr' : 'code128'}.svg`;
  }

  private releaseCodeUrls() {
    for (const label of this.labels()) {
      URL.revokeObjectURL(label.qr);
      URL.revokeObjectURL(label.barcode);
    }
  }

  print() {
    if (!this.labels().length) return;

    const printClass = 'inventory-code-print';
    const cleanup = () => {
      document.body.classList.remove(printClass);
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    document.body.classList.add(printClass);
    window.print();
  }
}
