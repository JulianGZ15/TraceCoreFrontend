import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { WorkspaceApi } from '../../../../core/http/workspace-api';
import { Feedback } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
export interface DecisionData {
  title: string;
  path: string;
  readPath: string;
  version: number;
  action: 'APPROVE' | 'REJECT' | 'REVOKE' | 'ARCHIVE' | 'WITHDRAW';
}
@Component({
  selector: 'tc-document-decision-editor',
  imports: [ReactiveFormsModule, Feedback],
  templateUrl: './decision-editor.component.html',
  styleUrl: './decision-editor.component.scss',
})
export class DecisionEditorComponent {
  readonly api = inject(WorkspaceApi);
  readonly data = inject<DecisionData>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });
  readonly error = signal('');
  readonly busy = signal(false);
  readonly reviewed = signal(true);
  version = this.data.version;
  close() {
    if (
      !this.busy() &&
      (!this.reason.dirty ||
        !this.api.session.valid() ||
        window.confirm('¿Descartar el motivo sin guardar?'))
    )
      this.ref.close();
  }
  private record(value: Record<string, any>): Record<string, any> {
    return value['document'] ?? value['metadata'] ?? value['view']?.link ?? value;
  }
  async consult() {
    this.busy.set(true);
    try {
      const result = this.record(await this.api.get<Record<string, any>>(this.data.readPath));
      const wanted = {
        APPROVE: 'APPROVED',
        REJECT: 'REJECTED',
        REVOKE: 'REVOKED',
        ARCHIVE: 'ARCHIVED',
        WITHDRAW: '',
      }[this.data.action];
      const reason =
        result['decisionReason'] ?? result['archiveReason'] ?? result['withdrawalReason'];
      if (
        reason === this.reason.value.trim() &&
        (this.data.action === 'WITHDRAW' ? !!result['withdrawnAt'] : result['state'] === wanted)
      ) {
        this.ref.close(result);
        return;
      }
      this.version = result['version'];
      this.reviewed.set(true);
      this.error.set(
        'Datos actuales consultados. Tu motivo se conserva; revisa antes de confirmar nuevamente.',
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async save() {
    this.reason.markAsTouched();
    if (this.reason.invalid || !this.reason.value.trim() || this.busy() || !this.reviewed()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const body: Record<string, unknown> = { reason: this.reason.value, version: this.version };
      if (['APPROVE', 'REJECT', 'REVOKE'].includes(this.data.action))
        body['action'] = this.data.action;
      this.ref.close(await this.api.post(this.data.path, body));
    } catch (e) {
      this.error.set(errorMessage(e) + ' Consulta el estado actual antes de otra confirmación.');
      this.reviewed.set(false);
    } finally {
      this.busy.set(false);
    }
  }
}
