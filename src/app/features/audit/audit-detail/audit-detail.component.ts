import { Component, inject } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Api, Audit } from '../../../core/http/api';
import { Session } from '../../../core/auth/session';
import { PageHeading, Feedback, Pagination } from '../../../shared/ui/page';
import { PageList } from '../../../shared/ui/list-model';
@Component({
  selector: 'tc-audit-detail',
  templateUrl: './audit-detail.component.html',
  styleUrl: './audit-detail.component.scss',
})
export class AuditDetail {
  readonly data = inject<{ event: Audit; zone: string }>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  entries() {
    const a = this.data.event;
    return [
      { label: 'Ocurrió', value: this.date(a.occurredAt) },
      { label: 'Registrado', value: this.date(a.recordedAt) },
      { label: 'Actor', value: a.actorUuid ?? 'Sin actor identificado' },
      { label: 'Tipo de recurso', value: a.resourceType },
      { label: 'Recurso', value: a.resourceUuid },
      { label: 'Correlación', value: a.correlationUuid },
      { label: 'Evento', value: a.uuid },
    ];
  }
  date(v: string) {
    return (
      new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: this.data.zone,
      }).format(new Date(v)) +
      ' · ' +
      this.data.zone
    );
  }
}
