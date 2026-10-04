import { Component, inject } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Api, Audit } from '../../../core/http/api';
import { Session } from '../../../core/auth/session';
import { PageHeading, Feedback, Pagination } from '../../../shared/ui/page';
import { PageList } from '../../../shared/ui/list-model';
import { AuditDetail } from '../audit-detail/audit-detail.component';
@Component({
  selector: 'tc-audit',
  imports: [PageHeading, Feedback, Pagination],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss',
})
export class AuditPage {
  readonly session = inject(Session);
  private api = inject(Api);
  private dialog = inject(Dialog);
  readonly list = new PageList<Audit>(this.api, '/audit');
  constructor() {
    void this.list.load();
  }
  date(v: string) {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: this.session.context()?.company.timezone ?? 'UTC',
    }).format(new Date(v));
  }
  detail(event: Audit) {
    this.dialog.open(AuditDetail, {
      data: { event, zone: this.session.context()?.company.timezone ?? 'UTC' },
      panelClass: 'drawer-overlay',
      ariaLabel: 'Detalle de auditoría',
    });
  }
}
