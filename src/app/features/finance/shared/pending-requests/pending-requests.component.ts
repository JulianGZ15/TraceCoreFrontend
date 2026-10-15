import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { RouterLink } from '@angular/router';
import { FinancePending } from '../../pending';
import { Pending } from '../../models';
import { message, entity, routeFor } from '../../rules';
import { confirm } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';
@Component({
  selector: 'tc-finance-pending-requests',
  imports: [RouterLink],
  templateUrl: './pending-requests.component.html',
  styleUrl: './pending-requests.component.scss',
})
export class PendingRequestsComponent {
  readonly pending = inject(FinancePending);
  readonly dialog = inject(Dialog);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly path = signal('');
  async act(p: Pending, recover: boolean) {
    if (
      !recover &&
      !(await confirm(
        this.dialog,
        'Repetir solicitud financiera',
        'Se repetirá exactamente la misma solicitud y se conservará su UUID.',
      ))
    )
      return;
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
