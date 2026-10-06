import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinancePending } from '../../pending';
import { Pending } from '../../models';
import { message, entity, routeFor } from '../../rules';
@Component({
  selector: 'tc-finance-pending-requests',
  imports: [RouterLink],
  templateUrl: './pending-requests.component.html',
  styleUrl: './pending-requests.component.scss',
})
export class PendingRequestsComponent {
  readonly pending = inject(FinancePending);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly path = signal('');
  async act(p: Pending, recover: boolean) {
    if (!recover && !window.confirm('¿Repetir exactamente la misma solicitud y UUID?')) return;
    this.busy.set(true);
    try {
      const r = recover ? await this.pending.recover(p) : await this.pending.repeat(p);
      this.path.set(routeFor(p.operation, entity(r).uuid));
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.busy.set(false);
    }
  }
}
