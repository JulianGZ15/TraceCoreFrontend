import { Component, ElementRef, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { InventoryApi } from '../../inventory-api';
import { InventoryPage } from '../../page-base';
import * as M from '../../models';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assetPathFromCode(value: string, origin: string): string | null {
  const text = value.trim();
  if (uuidPattern.test(text)) return `/equipos/${text.toLowerCase()}/general`;
  try {
    const url = new URL(text);
    if (url.origin !== origin) return null;
    const match = url.pathname.match(/\/equipos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/general)?\/?$/i);
    return match ? `/equipos/${match[1].toLowerCase()}/general` : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'tc-inventory-identifier-scan',
  imports: [FormsModule, PageHeading, Feedback, InventoryNavComponent, RouterLink],
  templateUrl: './identifier-scan.component.html',
  styleUrl: './identifier-scan.component.scss',
})
export class IdentifierScanComponent extends InventoryPage implements OnDestroy {
  readonly video = viewChild<ElementRef<HTMLVideoElement>>('preview');
  readonly cameraError = signal('');
  readonly status = signal('');
  scanned = '';
  readonly resolving = signal(false);
  private controls?: IScannerControls;
  private reader?: BrowserMultiFormatReader;
  private readonly inventoryApi = inject(InventoryApi);

  startCamera() {
    this.stopCamera();
    this.cameraError.set('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.cameraError.set('La cámara requiere HTTPS y permiso del navegador. Puedes ingresar el código manualmente.');
      return;
    }
    const video = this.video()?.nativeElement;
    if (!video) return;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    this.reader = new BrowserMultiFormatReader(hints);
    void this.reader.decodeFromVideoDevice(undefined, video, (result, error, controls) => {
      this.controls = controls;
      if (result && !this.resolving()) void this.resolve(result.getText());
      else if (error && !this.cameraError() && !String(error).includes('NotFoundException')) {
        this.cameraError.set('No se pudo leer el código. Revisa el enfoque o ingrésalo manualmente.');
      }
    }).catch(() => this.cameraError.set('No se pudo abrir la cámara. Revisa los permisos o ingresa el código manualmente.'));
  }

  stopCamera() {
    void this.controls?.stop();
    this.controls = undefined;
    this.reader = undefined;
  }

  async resolve(value = this.scanned) {
    const path = assetPathFromCode(value, window.location.origin);
    if (!path) {
      this.cameraError.set('El código no contiene un UUID o enlace de activo válido de TraceCore.');
      return;
    }
    this.stopCamera();
    this.resolving.set(true);
    this.cameraError.set('');
    this.status.set('Validando activo y permisos…');
    try {
      const uuid = path.split('/')[2];
      const profile = await this.inventoryApi.get<M.Profile>('/assets/' + uuid);
      this.status.set(profile.asset.lifecycle === 'RETIRED' ? 'Activo retirado. Abriendo su ficha.' : 'Activo identificado. Abriendo su ficha.');
      await this.router.navigateByUrl(path);
    } catch (error) {
      this.status.set('');
      this.cameraError.set(error && typeof error === 'object' && 'status' in error && error.status === 404
        ? 'No se encontró un activo con ese código.'
        : 'No se pudo validar el activo o no tienes acceso al patio correspondiente.');
    } finally {
      this.resolving.set(false);
    }
  }

  override ngOnDestroy() {
    this.stopCamera();
    super.ngOnDestroy();
  }
}
