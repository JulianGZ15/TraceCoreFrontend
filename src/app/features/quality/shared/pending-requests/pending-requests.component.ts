import { Component, inject, input, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, AbstractControl } from '@angular/forms';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import * as M from '../../models';
import { QualityPending } from '../../pending';
import { confirm } from '../../../../shared/ui/editor';
@Component({
  selector: 'tc-quality-pending',
  imports: [Feedback],
  templateUrl: './pending-requests.component.html',
  styleUrl: './pending-requests.component.scss',
})
export class PendingRequestsComponent extends QualityPage {
  readonly pending = inject(QualityPending);
  async consult(r: M.Pending) {
    await this.mutate(
      () => this.pending.receipt(r),
      (receipt) => {
        this.success.set('Resultado confirmado: ' + receipt.resourceUuid);
      },
    );
  }
  async repeat(r: M.Pending) {
    if (
      await confirm(
        this.dialog,
        'Repetir solicitud pendiente',
        'Se enviarán exactamente la misma clave y los mismos datos.',
      )
    )
      await this.mutate(
        () => this.pending.repeat(r),
        (result) => {
          this.success.set('Resultado confirmado: ' + result.uuid);
        },
      );
  }
  async forget(r: M.Pending) {
    if (
      await confirm(
        this.dialog,
        'Retirar pendiente local',
        'Esta acción no cancela una operación en el servidor. Revisa el expediente antes de crear otra.',
      )
    )
      this.pending.remove(r.key);
  }
}
