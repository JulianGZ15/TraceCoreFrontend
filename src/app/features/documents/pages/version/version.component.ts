import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { RecordValuesComponent } from '../../../../shared/ui/record-values/record-values.component';
import { Summary, VersionView } from '../../models';
import { decisionAllowed } from '../../rules';
import { DecisionEditorComponent } from '../../editors/decision-editor/decision-editor.component';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
@Component({
  selector: 'tc-document-version',
  imports: [RouterLink, PageHeading, Feedback, RecordValuesComponent],
  templateUrl: './version.component.html',
  styleUrl: './version.component.scss',
})
export class VersionComponent extends ReadPage {
  readonly dialog = inject(Dialog);
  readonly summary = signal<Summary | null>(null);
  readonly version = signal<VersionView | null>(null);
  readonly decisions = signal<unknown[]>([]);
  readonly decisionAllowed = decisionAllowed;
  id = '';
  versionId = '';
  override async load() {
    this.id = this.route.snapshot.paramMap.get('uuid') ?? '';
    this.versionId = this.route.snapshot.paramMap.get('versionUuid') ?? '';
    await this.read(
      async () => {
        const v = await this.api.get<VersionView>(
          '/documents/versions/' + this.versionId,
          {},
          this.stop,
        );
        if (v.metadata.documentUuid !== this.id)
          throw new Error('La versión no pertenece al documento de esta ruta.');
        const [s, d] = await Promise.all([
          this.api.get<Summary>('/documents/' + this.id + '/summary', {}, this.stop),
          this.api.get<unknown[]>(
            '/documents/versions/' + this.versionId + '/decisions',
            {},
            this.stop,
          ),
        ]);
        return { v, s, d };
      },
      (r) => {
        this.summary.set(r.s);
        this.version.set(r.v);
        this.decisions.set(r.d);
      },
    );
  }
  override clear() {
    this.summary.set(null);
    this.version.set(null);
    this.decisions.set([]);
  }
  async download() {
    const v = this.version();
    if (!v?.downloadable) return;
    try {
      await this.api.download(
        '/documents/versions/' + v.metadata.uuid + '/content',
        v.metadata.filename,
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  decide(action: 'APPROVE' | 'REJECT' | 'REVOKE') {
    const s = this.summary(),
      v = this.version();
    if (!s || !v || !decisionAllowed(s, v.metadata, action)) return;
    const title =
      action === 'APPROVE'
        ? 'Aprobar versión'
        : action === 'REJECT'
          ? 'Rechazar versión'
          : 'Revocar aprobación';
    this.dialog
      .open(DecisionEditorComponent, {
        data: {
          title,
          action,
          path: '/documents/versions/' + this.versionId + '/decisions',
          readPath: '/documents/versions/' + this.versionId,
          version: v.metadata.version,
        },
        width: '560px',
        maxWidth: 'calc(100vw - 32px)',
        disableClose: true,
        ariaLabel: title,
      })
      .closed.subscribe(() => void this.load());
  }
}
