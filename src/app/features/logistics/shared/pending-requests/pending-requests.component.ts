import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { RouterLink } from '@angular/router';
import { LogisticsPending } from '../../pending';
import { Pending, Entity } from '../../models';
import { message } from '../../rules';
import { confirm } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';
@Component({
  selector: 'tc-logistics-pending-requests',
  imports: [RouterLink],
  templateUrl: './pending-requests.component.html',
  styleUrl: './pending-requests.component.scss',
})
export class PendingRequestsComponent {
  readonly pending = inject(LogisticsPending);
  readonly dialog = inject(Dialog);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly recovered = signal<{ uuid: string; path: string } | null>(null);
  async act(p: Pending, recover: boolean) {
    if (
      !recover &&
      !(await confirm(
        this.dialog,
        'Repetir solicitud logística',
        'Se repetirá exactamente la misma solicitud, conservando clave y datos.',
      ))
    )
      return;
    this.busy.set(true);
    try {
      const r = (
        recover ? await this.pending.recover(p) : await this.pending.repeat(p)
      ) as Entity & { manifest?: Entity; movement?: Entity };
      const entity = r.manifest ?? r.movement ?? r;
      const parent = p.path.match(new RegExp('manifests/([a-f0-9-]{36})', 'i'))?.[1];
      const path =
        p.operation === 'MOVEMENT'
          ? '/inventario/movimientos/' + entity.uuid
          : p.operation === 'CHECK'
            ? '/logistica/comprobaciones/' + entity.uuid
            : p.operation === 'RECEIPT'
              ? '/logistica/entregas/' + entity.uuid
              : '/logistica/manifiestos/' + (parent ?? entity.manifestUuid ?? entity.uuid);
      this.recovered.set({ uuid: entity.uuid, path });
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.busy.set(false);
    }
  }
}
