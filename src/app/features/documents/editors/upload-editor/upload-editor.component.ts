import { Component, inject, signal, OnDestroy } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { WorkspaceApi } from '../../../../core/http/workspace-api';
import { Feedback } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
import { EvidencePickerComponent } from '../../shared/evidence-picker/evidence-picker.component';
import { Summary, EvidenceOption, DocumentVersion } from '../../models';
import { DocumentPending, PendingDocument, definiteFailure } from '../../pending';
import { validateFile } from '../../rules';
@Component({
  selector: 'tc-document-upload-editor',
  imports: [Feedback, EvidencePickerComponent],
  templateUrl: './upload-editor.component.html',
  styleUrl: './upload-editor.component.scss',
})
export class UploadEditorComponent implements OnDestroy {
  ngOnDestroy() {
    this.file.set(null);
    this.evidence.set(null);
    this.request = undefined;
  }
  readonly api = inject(WorkspaceApi);
  readonly data = inject<{
    summary: Summary;
    mode: 'UPLOAD' | 'IMPORT';
    pending?: PendingDocument;
  }>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  readonly pending = inject(DocumentPending);
  readonly summary = signal(this.data.summary);
  readonly file = signal<File | null>(null);
  readonly evidence = signal<EvidenceOption | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  request?: PendingDocument = this.data.pending;
  private conflict = false;
  select(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    try {
      if (file) validateFile(file);
      this.file.set(file);
      this.error.set('');
    } catch (e) {
      this.file.set(null);
      this.error.set(errorMessage(e));
    }
  }
  close() {
    if (
      !this.busy() &&
      ((!this.file() && !this.evidence()) ||
        !this.api.session.valid() ||
        window.confirm('¿Descartar esta captura? La solicitud pendiente conservará su UUID.'))
    )
      this.ref.close();
  }
  async reload() {
    this.busy.set(true);
    try {
      this.summary.set(
        await this.api.get<Summary>('/documents/' + this.summary().document.uuid + '/summary'),
      );
      this.conflict = false;
      if (this.request && !this.pending.own().some((p) => p.key === this.request?.key))
        this.request = undefined;
      this.error.set(
        'Datos actuales consultados. Revisa y confirma de nuevo; tu archivo o evidencia se conserva.',
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async recover() {
    if (!this.request) return;
    this.busy.set(true);
    try {
      const r = await this.pending.recover(this.request);
      this.ref.close(r);
    } catch (e) {
      this.error.set(
        errorMessage(e) +
          ' Un resultado no encontrado no confirma que no haya ocurrido un guardado.',
      );
    } finally {
      this.busy.set(false);
    }
  }
  async save() {
    if (this.busy() || this.conflict) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (!this.summary().actions.manage)
        throw new Error('No hay capacidad para cargar versiones.');
      const document = this.summary().document;
      const file = this.file();
      if (this.data.mode === 'UPLOAD') {
        if (!file) throw new Error('Selecciona el archivo original.');
        validateFile(file);
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())),
        )
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        if (
          this.request &&
          (this.request.filename !== file.name ||
            this.request.size !== file.size ||
            this.request.sha256 !== hash)
        )
          throw new Error(
            'El archivo no coincide con la solicitud pendiente. Consulta primero su resultado.',
          );
        if (!this.request)
          this.request = this.pending.track(
            'UPLOAD',
            '/documents/' + document.uuid + '/versions',
            { versionUuid: crypto.randomUUID(), documentVersion: document.version },
            { filename: file.name, size: file.size, sha256: hash },
          );
        const payload = this.request.payload;
        const form = new FormData();
        form.append('file', file);
        const result = await this.api.post<DocumentVersion>(this.request.path, form, {
          versionUuid: String(payload['versionUuid']),
          documentVersion: payload['documentVersion'] as number,
        });
        this.pending.remove(this.request);
        this.ref.close(result);
      } else {
        const e = this.evidence();
        if (!e && !this.request) throw new Error('Selecciona la evidencia a importar.');
        if (
          this.request &&
          e &&
          (this.request.payload['sourceUuid'] !== e.uuid ||
            this.request.payload['sourceKind'] !== e.kind)
        )
          throw new Error('La evidencia cambió; concilia primero la solicitud pendiente.');
        if (!this.request && e)
          this.request = this.pending.track('IMPORT', '/documents/' + document.uuid + '/imports', {
            uuid: crypto.randomUUID(),
            sourceKind: e.kind,
            sourceUuid: e.uuid,
            documentVersion: document.version,
          });
        const result = await this.pending.repeat(this.request!);
        this.ref.close(result);
      }
    } catch (e) {
      if (this.request && definiteFailure(e)) this.pending.remove(this.request);
      this.error.set(errorMessage(e));
      this.conflict = !!e && typeof e === 'object' && 'status' in e && e.status === 409;
    } finally {
      this.busy.set(false);
    }
  }
}
