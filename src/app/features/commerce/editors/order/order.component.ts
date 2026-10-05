import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Field, Entity } from '../../models';
import { instant } from '../../rules';
@Component({
  selector: 'tc-commerce-order-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss',
})
export class OrderComponent extends CommerceEditor {
  override permission = 'COMMERCIAL_MANAGE';
  uuid = '';
  type = 'OC';
  common: Field[] = [];
  setup() {
    const s = this.data.summary,
      o = s?.order;
    this.uuid = o?.uuid ?? crypto.randomUUID();
    this.type = o?.type ?? 'OC';
    this.title = o ? 'Corregir orden DRAFT' : 'Crear cabecera de orden';
    this.common = [
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        choices: ['OC', 'OV', 'OR'],
        readonly: !!o,
        required: true,
      },
      { key: 'series', label: 'Serie', required: true, readonly: !!o },
      { key: 'folio', label: 'Folio', required: true, readonly: !!o },
      {
        key: 'partyUuid',
        label: 'Contraparte',
        type: 'lookup',
        resource: 'party-options',
        required: true,
        readonly: !!o,
      },
      { key: 'currency', label: 'Divisa ISO', required: true, readonly: !!o, max: 3 },
      { key: 'orderedAt', label: 'Fecha de orden', type: 'instant', required: true, readonly: !!o },
      { key: 'avlScope', label: 'Alcance AVL exacto (OC)', required: true },
      {
        key: 'termsUuid',
        label: 'Condiciones comerciales (opcional)',
        type: 'lookup',
        resource: 'terms-options',
        params: { partyUuid: o?.partyUuid ?? '', currency: o?.currency ?? 'MXN' },
      },
      {
        key: 'termsReference',
        label: 'Referencia de términos',
        type: 'textarea',
        required: true,
        max: 1000,
      },
    ];
    this.build({
      type: this.type,
      series: o?.series ?? 'MAIN',
      folio: o?.folio ?? '',
      partyUuid: o?.partyUuid ?? '',
      currency: o?.currency ?? 'MXN',
      orderedAt: o?.['orderedAt'] ?? new Date().toISOString(),
      avlScope: o?.['avlScope'] ?? 'GENERAL',
      termsUuid: o?.['termsUuid'] ?? '',
      termsReference: o?.['termsReference'] ?? '',
      ...(s?.purchase
        ? {
            promisedAt: s.purchase['promisedAt'],
            deliveryTerms: s.purchase['deliveryTerms'],
            supplierReference: s.purchase['supplierReference'],
          }
        : {}),
      ...(s?.sale
        ? {
            destinationSiteUuid: s.sale['destinationSiteUuid'],
            deliveryTerms: s.sale['deliveryTerms'],
            ownershipTransferTerms: s.sale['ownershipTransferTerms'],
          }
        : {}),
      ...(s?.rental ? { ...s.rental } : {}),
      timezone: s?.rental?.['timezone'] ?? this.session.context()?.company.timezone,
    });
  }
  build(values: Record<string, unknown>) {
    const detail: Field[] =
      this.type === 'OC'
        ? [
            { key: 'promisedAt', label: 'Fecha prometida', type: 'instant', required: true },
            {
              key: 'deliveryTerms',
              label: 'Condiciones de entrega',
              type: 'textarea',
              required: true,
              max: 1000,
            },
            { key: 'supplierReference', label: 'Referencia de proveedor', max: 500 },
          ]
        : this.type === 'OV'
          ? [
              {
                key: 'destinationSiteUuid',
                label: 'Sitio destino',
                type: 'lookup',
                resource: 'site-options',
                required: true,
              },
              {
                key: 'deliveryTerms',
                label: 'Condiciones de entrega',
                type: 'textarea',
                required: true,
                max: 1000,
              },
              {
                key: 'ownershipTransferTerms',
                label: 'Términos de transmisión de propiedad',
                type: 'textarea',
                required: true,
                max: 1000,
              },
            ]
          : [
              {
                key: 'frameworkUuid',
                label: 'Contrato marco (opcional)',
                type: 'lookup',
                resource: 'framework-options',
              },
              {
                key: 'distributorUuid',
                label: 'Distribuidor (opcional)',
                type: 'lookup',
                resource: 'party-options',
                params: { purpose: 'DISTRIBUTOR' },
              },
              {
                key: 'endCustomerUuid',
                label: 'Cliente final',
                type: 'lookup',
                resource: 'party-options',
                params: { purpose: 'END_CUSTOMER' },
                required: true,
              },
              {
                key: 'payerUuid',
                label: 'Pagador',
                type: 'lookup',
                resource: 'party-options',
                params: { purpose: 'PAYER' },
                required: true,
              },
              {
                key: 'siteUuid',
                label: 'Sitio de renta',
                type: 'lookup',
                resource: 'site-options',
                required: true,
              },
              { key: 'plannedFrom', label: 'Inicio previsto', type: 'instant', required: true },
              { key: 'plannedTo', label: 'Fin previsto', type: 'instant', required: true },
              { key: 'timezone', label: 'Zona contractual IANA', required: true },
              {
                key: 'responsibilities',
                label: 'Responsabilidades',
                type: 'textarea',
                required: true,
              },
            ];
    this.make([...this.common, ...detail], values);
    this.form.get('type')?.valueChanges.subscribe((v) => {
      if (v === this.type) return;
      const raw = this.form.getRawValue();
      this.type = v;
      this.build(raw);
      this.form.markAsDirty();
    });
    this.form.valueChanges.subscribe(() => {
      const v = this.form.getRawValue();
      this.fields = this.fields.map((f) =>
        f.key === 'termsUuid' &&
        (f.params?.['partyUuid'] !== v['partyUuid'] || f.params?.['currency'] !== v['currency'])
          ? { ...f, params: { partyUuid: v['partyUuid'], currency: v['currency'] } }
          : f,
      );
    });
  }
  override allowed() {
    return (
      super.allowed() &&
      (!this.data.summary || this.type !== 'OR' || this.access.can('RENTAL_MANAGE', this.data.yard))
    );
  }
  submit() {
    const v = this.form.getRawValue(),
      s = this.data.summary;
    const purchase =
      this.type === 'OC'
        ? {
            promisedAt: instant(v['promisedAt']),
            deliveryTerms: v['deliveryTerms'],
            supplierReference: v['supplierReference'] || null,
          }
        : null;
    const sale =
      this.type === 'OV'
        ? {
            destinationSiteUuid: v['destinationSiteUuid'],
            deliveryTerms: v['deliveryTerms'],
            ownershipTransferTerms: v['ownershipTransferTerms'],
          }
        : null;
    const rental =
      this.type === 'OR'
        ? {
            frameworkUuid: v['frameworkUuid'] || null,
            distributorUuid: v['distributorUuid'] || null,
            endCustomerUuid: v['endCustomerUuid'],
            payerUuid: v['payerUuid'],
            siteUuid: v['siteUuid'],
            plannedFrom: instant(v['plannedFrom']),
            plannedTo: instant(v['plannedTo']),
            timezone: v['timezone'],
            responsibilities: v['responsibilities'],
          }
        : null;
    const detail = {
      avlScope: v['avlScope'],
      termsUuid: v['termsUuid'] || null,
      termsReference: v['termsReference'],
      purchase,
      sale,
      rental,
    };
    return s
      ? this.api.put<Entity>('/orders/' + s.order.uuid, {
          ...detail,
          version: s.order.version,
          detailVersion: (s.purchase ?? s.sale ?? s.rental)!.version,
        })
      : this.create('ORDER', '/orders', {
          ...detail,
          uuid: this.uuid,
          type: this.type,
          series: v['series'],
          folio: v['folio'],
          partyUuid: v['partyUuid'],
          yardUuid: this.data.yard,
          currency: v['currency'],
          orderedAt: instant(v['orderedAt']),
        });
  }
}
