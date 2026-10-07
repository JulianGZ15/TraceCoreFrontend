import { TestBed } from '@angular/core/testing';
import { Type, signal, importProvidersFrom } from '@angular/core';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { DialogModule, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BehaviorSubject, Subject } from 'rxjs';
import { vi } from 'vitest';
import { WorkspaceApi } from '../../core/http/workspace-api';
import { Session } from '../../core/auth/session';
import { Summary, VersionView } from './models';
export const ids = {
  actor: '00000000-0000-0000-0000-000000000001',
  owner: '00000000-0000-0000-0000-000000000002',
  document: '00000000-0000-0000-0000-000000000003',
  file: '00000000-0000-0000-0000-000000000004',
};
export const testVersion: VersionView = {
  metadata: {
    uuid: ids.file,
    documentUuid: ids.document,
    number: 1,
    version: 0,
    state: 'DRAFT',
    filename: 'source.pdf',
    mediaType: 'application/pdf',
    size: 10,
    sha256: 'a'.repeat(64),
    source: null,
    uploadedAt: '2026-10-06T00:00:00Z',
    decidedAt: null,
    decisionReason: null,
  },
  current: false,
  downloadable: true,
};
export const testSummary: Summary = {
  document: {
    uuid: ids.document,
    title: 'Documento autorizado',
    type: 'GENERAL',
    classification: 'INTERNAL',
    owner: { kind: 'PARTY', uuid: ids.owner },
    state: 'ACTIVE',
    currentVersionUuid: null,
    version: 0,
    createdAt: '2026-10-06T00:00:00Z',
    archiveReason: null,
  },
  ownerLabel: 'Tercero',
  current: null,
  latest: testVersion,
  actions: { manage: true, approve: true, archive: true, link: true },
  evaluatedAt: '2026-10-06T00:00:00Z',
};
export async function renderWorkspace<T>(
  component: Type<T>,
  options: {
    data?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string>;
    inputs?: Record<string, unknown>;
    entity?: string;
  } = {},
) {
  sessionStorage.removeItem('tracecore.documents.pending');
  const ended = new Subject<void>();
  const session = {
    can: vi.fn(() => true),
    valid: () => true,
    epoch: signal(0),
    ended,
    user: signal({ uuid: ids.actor }),
    selectedYard: signal(''),
    context: signal({ company: { timezone: 'UTC' }, companyPermissions: [], yards: [] }),
  };
  const empty = { items: [], offset: 0, limit: 25, hasMore: false, nextOffset: null };
  const api = {
    session,
    base: '',
    get: vi.fn(async (path: string) =>
      path.endsWith('/summary')
        ? path.includes('/documents')
          ? testSummary
          : {
              profile: { uuid: ids.owner },
              sections: { technicalHistory: true, composition: true, contacts: true },
              generatedAt: '2026-10-06T00:00:00Z',
            }
        : path.includes('/sections/')
          ? {
              authorized: true,
              data: empty,
              collection: 'owners',
              generatedAt: '2026-10-06T00:00:00Z',
            }
          : path.endsWith('/decisions')
            ? []
            : path === '/documents/versions/' + ids.file
              ? testVersion
              : path === '/documents/' + ids.document
                ? { document: testSummary.document, versions: [testVersion], hasMore: false }
                : empty,
    ),
    post: vi.fn(async () => testSummary.document),
    download: vi.fn(async () => null),
  };
  const pm = new BehaviorSubject(
    convertToParamMap(
      options.params ?? { uuid: ids.document, versionUuid: ids.file, seccion: 'resumen' },
    ),
  );
  const qm = new BehaviorSubject(convertToParamMap(options.query ?? {}));
  const ref = { close: vi.fn() };
  const data = options.data ?? { summary: testSummary, mode: 'UPLOAD' };
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      importProvidersFrom(DialogModule),
      { provide: WorkspaceApi, useValue: api },
      { provide: Session, useValue: session },
      { provide: DIALOG_DATA, useValue: data },
      { provide: DialogRef, useValue: ref },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: pm,
          queryParamMap: qm,
          snapshot: {
            paramMap: pm.value,
            queryParamMap: qm.value,
            data: { entity: options.entity ?? 'equipment' },
          },
        },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(options.inputs ?? {})) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, api, session, ref, pm, qm };
}
