import { Component, inject, signal } from '@angular/core';
import { CommercePending } from '../../pending';
import { message } from '../../rules';
import { Pending } from '../../models';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'tc-commerce-pending-requests',
  imports: [RouterLink],
  templateUrl: './pending-requests.component.html',
  styleUrl: './pending-requests.component.scss',
})
export class PendingRequestsComponent {
  readonly pending = inject(CommercePending);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly recovered = signal<{ uuid: string; path: string } | null>(null);
  async act(p: Pending, recover: boolean) {
    if (
      !recover &&
      !window.confirm(
        'Repetir exactamente la misma solicitud pendiente, conservando clave y datos?',
      )
    )
      return;
    this.busy.set(true);
    try {
      const result = (
        recover ? await this.pending.recover(p) : await this.pending.repeat(p)
      ) as Record<string, any>;
      const entity =
        result?.['order'] ??
        result?.['receipt'] ??
        result?.['returned'] ??
        (Array.isArray(result) ? result[0] : result);
      if (entity?.uuid) {
        const prefix: Record<string, string> = {
          ORDER: 'ordenes',
          FRAMEWORK: 'marcos',
          RECEIPT: 'recepciones',
          RETURN: 'devoluciones',
          BILLING: 'cortes',
        };
        const parent = entity.orderUuid ?? p.payload['orderUuid'];
        const rental = entity.agreementUuid ?? p.payload['agreementUuid'];
        const path = prefix[p.operation]
          ? '/comercial/' + prefix[p.operation] + '/' + entity.uuid
          : parent
            ? '/comercial/ordenes/' + parent
            : rental
              ? '/comercial/rentas/' + rental
              : '/comercial/ordenes';
        this.recovered.set({ uuid: entity.uuid, path });
      }
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.busy.set(false);
    }
  }
}
