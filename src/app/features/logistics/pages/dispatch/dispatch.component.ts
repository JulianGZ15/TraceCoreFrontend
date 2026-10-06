import { takeUntil } from 'rxjs';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogisticsPage } from '../../page';
import { LogisticsPending } from '../../pending';
import { Entity, Summary, VerificationContext, Check, Row, Field } from '../../models';
import { form, message, label } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
@Component({
  selector: 'tc-logistics-dispatch',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldsComponent,
    PendingRequestsComponent,
    PageHeading,
    Feedback,
  ],
  templateUrl: './dispatch.component.html',
  styleUrl: './dispatch.component.scss',
})
export class DispatchComponent extends LogisticsPage {
  protected override resourceChanged() {
    this.form.reset();
    this.check.set(null);
  }
  override ngOnInit() {
    super.ngOnInit();
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      this.form.reset();
      this.check.set(null);
    });
  }
  override mode = 'manifest';
  readonly pending = inject(LogisticsPending);
  readonly check = signal<Check | null>(null);
  readonly saving = signal(false);
  readonly fields: Field[] = [
    {
      key: 'authorizationReference',
      label: 'Referencia de autorización de salida',
      required: true,
      max: 500,
    },
    {
      key: 'repairAuthorizationReference',
      label: 'Autorización de reparación, cuando aplique',
      max: 500,
    },
  ];
  readonly form = form(this.fields);
  dirty() {
    return this.form.dirty;
  }
  protected override async afterLoad() {
    const id = this.summary()?.manifest['dispatchCheckUuid'];
    this.check.set(id ? await this.api.get<Check>('/checks/' + id, {}, this.stop) : null);
  }
  expires() {
    const t = this.check()?.checkedAt;
    return t ? new Date(Date.parse(t) + 1800000).toISOString() : '';
  }
  allowed() {
    const m = this.summary()?.manifest;
    return (
      !!m &&
      m.state === 'CHECKED' &&
      this.access.can('LOGISTICS_DISPATCH', m.yardUuid) &&
      this.access.can('MOVEMENT_MANAGE', m.sourceYardUuid ?? undefined) &&
      (!m.destinationSiteUuid || this.access.can('DISPATCH_APPROVE', m.sourceYardUuid ?? undefined))
    );
  }
  async current() {
    try {
      this.summary.set(
        await this.api.get<Summary>('/manifests/' + this.id + '/summary', {}, this.stop),
      );
      await this.afterLoad();
    } catch (e) {
      this.error.set(message(e));
    }
  }
  async save() {
    this.form.markAllAsTouched();
    const s = this.summary(),
      c = this.check();
    if (!s || !c || this.saving() || this.form.invalid || !this.allowed()) return;
    try {
      if (Date.now() >= Date.parse(c.checkedAt!) + 1800000)
        throw new Error('La comprobación venció; vuelve a verificar la carga.');
      if (!window.confirm('¿Confirmar la salida física de toda la carga?')) return;
      this.saving.set(true);
      const v = this.form.getRawValue();
      await this.pending.create('DISPATCH', '/manifests/' + this.id + '/dispatch', {
        ...v,
        repairAuthorizationReference: v['repairAuthorizationReference'] || null,
        requestKey: crypto.randomUUID(),
        checkUuid: c.uuid,
        version: s.manifest.version,
      });
      this.form.markAsPristine();
      void this.router.navigate(['/logistica/manifiestos', this.id]);
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.saving.set(false);
    }
  }
}
