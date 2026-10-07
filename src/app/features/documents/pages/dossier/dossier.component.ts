import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordValuesComponent } from '../../../../shared/ui/record-values/record-values.component';
import { Page } from '../../../../core/http/workspace-api';
import { Summary, VersionView, Linked } from '../../models';
import { linkState } from '../../rules';
import { UploadEditorComponent } from '../../editors/upload-editor/upload-editor.component';
import { LinkEditorComponent } from '../../editors/link-editor/link-editor.component';
import {
  DecisionEditorComponent,
  DecisionData,
} from '../../editors/decision-editor/decision-editor.component';
@Component({
  selector: 'tc-document-dossier',
  imports: [RouterLink, PageHeading, Feedback, Pagination, RecordValuesComponent],
  templateUrl: './dossier.component.html',
  styleUrl: './dossier.component.scss',
})
export class DossierComponent extends ReadPage {
  readonly dialog = inject(Dialog);
  readonly summary = signal<Summary | null>(null);
  readonly versions = signal<VersionView[]>([]);
  readonly links = signal<Linked[]>([]);
  readonly hasMore = signal(false);
  readonly linkState = linkState;
  id = '';
  section = 'resumen';
  override async load() {
    this.id = this.route.snapshot.paramMap.get('uuid') ?? '';
    this.section = this.route.snapshot.paramMap.get('seccion') ?? 'resumen';
    if (!['resumen', 'versiones', 'vinculos'].includes(this.section)) {
      this.error.set('Sección desconocida.');
      return;
    }
    await this.read(
      async () => {
        const summary = await this.api.get<Summary>(
          '/documents/' + this.id + '/summary',
          {},
          this.stop,
        );
        if (this.section === 'versiones') {
          const detail = await this.api.get<{ versions: VersionView[]; hasMore: boolean }>(
            '/documents/' + this.id,
            { offset: this.offset, limit: this.limit },
            this.stop,
          );
          return { summary, versions: detail.versions, links: [], hasMore: detail.hasMore };
        }
        if (this.section === 'vinculos') {
          const p = await this.api.get<Page<Linked>>(
            '/documents/' + this.id + '/links',
            { offset: this.offset, limit: this.limit },
            this.stop,
          );
          return { summary, versions: [], links: p.items, hasMore: p.hasMore };
        }
        return { summary, versions: [], links: [], hasMore: false };
      },
      (r) => {
        this.summary.set(r.summary);
        this.versions.set(r.versions);
        this.links.set(r.links);
        this.hasMore.set(r.hasMore);
      },
    );
  }
  override clear() {
    this.summary.set(null);
    this.versions.set([]);
    this.links.set([]);
  }
  upload(mode: 'UPLOAD' | 'IMPORT') {
    const summary = this.summary();
    if (!summary) return;
    this.dialog
      .open(UploadEditorComponent, {
        data: { summary, mode },
        width: '780px',
        maxWidth: 'calc(100vw - 32px)',
        disableClose: true,
        ariaLabel: mode === 'UPLOAD' ? 'Cargar nueva versión' : 'Importar evidencia',
      })
      .closed.subscribe(() => void this.load());
  }
  link() {
    const data = this.summary();
    if (data)
      this.dialog
        .open(LinkEditorComponent, {
          data,
          width: '780px',
          maxWidth: 'calc(100vw - 32px)',
          disableClose: true,
          ariaLabel: 'Vincular versión',
        })
        .closed.subscribe(() => void this.load());
  }
  decision(data: DecisionData) {
    this.dialog
      .open(DecisionEditorComponent, {
        data,
        width: '560px',
        maxWidth: 'calc(100vw - 32px)',
        disableClose: true,
        ariaLabel: data.title,
      })
      .closed.subscribe(() => void this.load());
  }
  archive() {
    const s = this.summary();
    if (s)
      this.decision({
        title: 'Archivar documento',
        path: '/documents/' + this.id + '/archive',
        readPath: '/documents/' + this.id + '/summary',
        version: s.document.version,
        action: 'ARCHIVE',
      });
  }
  withdraw(row: Linked) {
    const l = row.view.link;
    this.decision({
      title: 'Retirar vínculo',
      path: '/documents/links/' + l.subject.kind + '/' + l.uuid + '/withdraw',
      readPath: '/documents/links/' + l.subject.kind + '/' + l.uuid,
      version: l.version,
      action: 'WITHDRAW',
    });
  }
}
