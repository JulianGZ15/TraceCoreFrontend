import { Directive, inject, output, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { QualityPage } from './page-base';
import { uuidPattern } from './rules';
@Directive()
export abstract class QualityEditor extends QualityPage {
  abstract readonly operationCapability: string;
  readonly compatible = signal(true);
  readonly companyOperation: boolean = false;
  canWrite() {
    return this.companyOperation
      ? this.access.global(this.operationCapability)
      : this.operationCapability === 'TRANSITION' || this.access.any(this.operationCapability);
  }
  private async authorize() {
    if (this.operationCapability === 'TRANSITION') return;
    if (this.companyOperation) {
      if (!this.access.global(this.operationCapability))
        throw new Error('No tienes permiso de empresa para esta operación.');
      return;
    }
    let piece = this.form.get('assetUuid')?.value ?? this.data.assetUuid;
    if (!piece && this.data.orderUuid)
      piece = (await this.get<import('./models').WorkOrder>('/maintenance/' + this.data.orderUuid))
        .assetUuid;
    if (!piece) throw new Error('Selecciona la pieza antes de continuar.');
    const asset = await this.get<import('./models').Asset>('/assets/' + piece + '/summary');
    if (!this.access.can(this.operationCapability, asset.yardUuid))
      throw new Error('No tienes permiso para operar esta pieza en su patio efectivo.');
  }
  readonly saved = output<unknown>();
  readonly data = inject<{
    assetUuid?: string | null;
    uuid?: string | null;
    orderUuid?: string;
    orderVersion?: number;
    record?: unknown;
    evidenceRequired?: boolean;
    path?: string;
    version?: number;
    mtrVersion?: number;
    approved?: boolean;
  }>(DIALOG_DATA, { optional: true }) ?? {
    assetUuid: this.route.snapshot.queryParamMap.get('assetUuid'),
    uuid: this.route.snapshot.paramMap.get('uuid'),
  };
  readonly ref = inject(DialogRef, { optional: true });
  readonly fb = inject(FormBuilder);
  readonly required = Validators.required;
  readonly uuid = [Validators.required, Validators.pattern(uuidPattern)];
  abstract readonly form: import('@angular/forms').FormGroup;
  protected override clear() {
    this.form?.reset();
  }
  async cancel() {
    if (!this.form.dirty || (await this.discard())) {
      this.form.markAsPristine();
      if (this.ref) this.ref.close();
      else await this.router.navigate(['/calidad/equipos']);
    }
  }
  async saveWith<T>(save: () => Promise<T>) {
    if (!this.compatible()) {
      this.error.set('Backend incompatible: faltan decimales exactos.');
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Revisa los campos obligatorios y su formato.');
      return;
    }
    await this.mutate(
      async () => {
        await this.authorize();
        return save();
      },
      (r) => {
        this.form.markAsPristine();
        this.saved.emit(r);
        if (this.ref) this.ref.close(r);
        else if (r && typeof r === 'object' && 'uuid' in r)
          void this.router.navigate(['/calidad', this.route.snapshot.data['resource'], r.uuid]);
      },
    );
  }
}
