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
  readonly preview = signal<M.IdentifierLabel | null>(null);
  readonly labels = signal<M.IdentifierLabel[]>([]);
  readonly mobileStep = signal<'assets' | 'preview'>('assets');
  readonly dxfBusy = signal(false);
  search = '';
  locationUuid = '';

  constructor() { super(); }

  private readonly coreApi = inject(Api);
  private readonly knownAssets = new Map<string, M.AssetRow>();
  private logoPromise?: Promise<string | null>;
  private previewGeneration = 0;

  override ngOnDestroy() {
    this.releaseCodeUrls();
    super.ngOnDestroy();
  }

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
    this.releasePrintLabels();
    await this.request(
      () => this.api.get<M.AssetRow[]>('/assets', this.params({ search: this.search || null, locationUuid: this.locationUuid || null, limit: 100, offset: 0 })),
      (rows) => {
        this.rows.set(rows);
        for (const row of rows) this.knownAssets.set(row.uuid, row);
      },
    );
    if (!this.activeUuid() || !this.selected().has(this.activeUuid())) {
      this.activeUuid.set(this.selected().values().next().value ?? '');
    }
    await this.refreshPreview();
  }

  readonly activeUuid = signal('');

  setLocation(uuid: string) {
    this.locationUuid = uuid;
    this.selected.set(new Set());
    this.activeUuid.set('');
    this.previewGeneration++;
    void this.load();
  }

  toggle(row: M.AssetRow, checked: boolean) {
    const selected = new Set(this.selected());
    if (checked && selected.size < 100) {
      selected.add(row.uuid);
      this.activeUuid.set(row.uuid);
      this.mobileStep.set('preview');
    } else if (!checked) {
      selected.delete(row.uuid);
      if (this.activeUuid() === row.uuid) this.activeUuid.set(selected.values().next().value ?? '');
    }
    this.selected.set(selected);
    void this.refreshPreview();
  }

  goToPreview(offset: number) {
    const ids = [...this.selected()];
    if (!ids.length) return;
    const current = Math.max(0, ids.indexOf(this.activeUuid()));
    this.activeUuid.set(ids[(current + offset + ids.length) % ids.length]);
    void this.refreshPreview();
  }

  selectedPosition(uuid: string) {
    return [...this.selected()].indexOf(uuid) + 1;
  }

  private async refreshPreview() {
    const generation = ++this.previewGeneration;
    this.releasePreviewUrl();
    this.preview.set(null);
    const row = this.knownAssets.get(this.activeUuid());
    if (!row || !this.selected().has(row.uuid)) return;
    try {
      const logo = await this.logoDataUrl();
      if (generation !== this.previewGeneration) return;
      this.preview.set(this.makeLabel(row, logo ?? undefined));
    } catch {
      if (generation === this.previewGeneration) this.error.set('No se pudo cargar el logo para la vista previa.');
    }
  }

  private makeLabel(asset: M.IdentifierAsset, logo?: string, includeBarcodeText = true): M.IdentifierLabel {
    const mode = this.session.context()?.company.assetIdentifierMode ?? 'UUID';
    const codeValue = mode === 'INTERNAL_CODE' ? asset.internalCode : asset.uuid;
    return { asset, codeValue, codeMode: mode, ...createIdentifierCodes(codeValue, logo, { includeBarcodeText }) };
  }

  private async logoDataUrl(): Promise<string | null> {
    if (!this.logoPromise) {
      this.logoPromise = (async () => {
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
          this.logoPromise = undefined;
          throw error;
        }
      })();
    }
    return this.logoPromise;
  }

  clearSelection() {
    this.previewGeneration++;
    this.releaseCodeUrls();
    this.selected.set(new Set());
    this.activeUuid.set('');
    this.labels.set([]);
  }

  sourceLabel(mode: M.IdentifierLabel['codeMode']) {
    return mode === 'UUID' ? 'UUID' : 'Marcación interna';
  }

  dxfEnabled() { return this.session.context()?.company.identifierDxfEnabled === true; }
  dxfWidth() { return this.session.context()?.company.identifierDxfWidthMm ?? 120; }
  dxfHeight() { return this.session.context()?.company.identifierDxfHeightMm ?? 50; }

  downloadName(label: M.IdentifierLabel, kind: 'qr' | 'barcode') {
    const code = label.codeValue.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || label.asset.uuid;
    return `${code}-${kind === 'qr' ? 'qr' : 'code128'}.svg`;
  }

  async downloadDxf(selected = false) {
    const ids = selected ? [...this.selected()] : this.preview() ? [this.preview()!.asset.uuid] : [];
    if (!ids.length || !this.dxfEnabled()) return;
    this.dxfBusy.set(true);
    this.error.set('');
    try {
      const blob = await this.coreApi.postBlob('/inventory/assets/identifiers/dxf', { assetUuids: ids });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = ids.length === 1
        ? `${(this.preview()?.codeValue ?? 'activo').replace(/[^a-zA-Z0-9_-]+/g, '-')}.dxf`
        : 'identificadores-dxf.zip';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      this.error.set('No se pudieron generar los archivos DXF. Revisa tu acceso y la configuración de empresa.');
    } finally {
      this.dxfBusy.set(false);
    }
  }

  print() {
    const assets = [...this.selected()].map((id) => this.knownAssets.get(id)).filter((row): row is M.AssetRow => !!row);
    if (!assets.length) return;
    this.releasePrintLabels();
    try {
      this.labels.set(assets.map((asset) => this.makeLabel(asset, undefined, false)));
      const cleanup = () => {
        document.body.classList.remove('inventory-code-print');
        this.releasePrintLabels();
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      document.body.classList.add('inventory-code-print');
      window.print();
    } catch {
      this.error.set('No se pudieron preparar las etiquetas para impresión.');
    }
  }

  private releasePreviewUrl() {
    const label = this.preview();
    if (label) {
      URL.revokeObjectURL(label.qr);
      URL.revokeObjectURL(label.barcode);
    }
  }

  private releasePrintLabels() {
    for (const label of this.labels()) {
      URL.revokeObjectURL(label.qr);
      URL.revokeObjectURL(label.barcode);
    }
    this.labels.set([]);
  }

  private releaseCodeUrls() {
    this.releasePreviewUrl();
    this.preview.set(null);
    this.releasePrintLabels();
  }
}
