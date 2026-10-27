import { Skeleton } from '../../../../shared/ui/skeleton/skeleton.component';
import { DataTable } from '../../../../shared/ui/data-table/data-table.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionPage } from '../../section-page';
import { Address } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordEditorComponent } from '../../editors/record-editor/record-editor.component';
import { addressFields } from '../../record-fields';

@Component({
  selector: 'tc-party-delivery-sites',
  imports: [Skeleton, DataTable, Feedback, Pagination, RouterLink],
  templateUrl: './delivery-sites.component.html',
  styleUrl: './delivery-sites.component.scss',
})
export class DeliverySitesComponent extends SectionPage<Address> {
  readonly kind = 'addresses' as const;
  override async load(offset = this.offset()) {
    const generation = ++this.deliveryGeneration;
    const uuid = this.uuid;
    const epoch = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.deliverySites(uuid, offset, this.limit());
      if (generation !== this.deliveryGeneration || uuid !== this.uuid || epoch !== this.session.epoch()) return;
      this.rows.set(rows);
      this.offset.set(offset);
    } catch {
      if (generation === this.deliveryGeneration) this.error.set('No se pudieron consultar los sitios de entrega.');
    } finally {
      if (generation === this.deliveryGeneration) this.busy.set(false);
    }
  }
  private deliveryGeneration = 0;
  override ngOnDestroy() {
    ++this.deliveryGeneration;
    super.ngOnDestroy();
  }
  async edit(row?: Address) {
    await this.open(RecordEditorComponent, {
      title: row ? 'Editar sitio de entrega' : 'Nuevo sitio de entrega',
      party: this.uuid,
      kind: this.kind,
      row,
      fields: addressFields,
      initial: row
        ? { ...row }
        : { type: 'DELIVERY', country: 'MX', active: true, externalDeliveryEnabled: true },
    });
  }
}
