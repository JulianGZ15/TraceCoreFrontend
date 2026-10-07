import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { WorkspaceApi } from '../../core/http/workspace-api';
import { uuidPattern } from './rules';
import { subjectKinds } from './models';
export interface PendingDocument {
  actor: string;
  key: string;
  operation: 'CREATE' | 'IMPORT' | 'LINK' | 'UPLOAD';
  path: string;
  payload: Record<string, unknown>;
  filename?: string;
  size?: number;
  sha256?: string;
}
export function validPending(p: PendingDocument) {
  if (
    !p ||
    !uuidPattern.test(p.actor) ||
    !uuidPattern.test(p.key) ||
    !p.payload ||
    typeof p.payload !== 'object' ||
    String(p.payload['uuid'] ?? p.payload['versionUuid']) !== p.key
  )
    return false;
  const id = '[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}';
  switch (p.operation) {
    case 'CREATE':
      return p.path === '/documents';
    case 'LINK':
      return (
        p.path === '/documents/links' &&
        subjectKinds.includes(p.payload['subjectKind'] as any) &&
        uuidPattern.test(String(p.payload['subjectUuid']))
      );
    case 'IMPORT':
      return new RegExp('^/documents/' + id + '/imports$', 'i').test(p.path);
    case 'UPLOAD':
      return (
        new RegExp('^/documents/' + id + '/versions$', 'i').test(p.path) &&
        typeof p.filename === 'string' &&
        typeof p.size === 'number' &&
        /^[a-f0-9]{64}$/.test(p.sha256 ?? '')
      );
    default:
      return false;
  }
}
export function definiteFailure(e: unknown) {
  return (
    e instanceof HttpErrorResponse && [400, 401, 403, 404, 409, 413, 415, 422].includes(e.status)
  );
}
@Injectable({ providedIn: 'root' })
export class DocumentPending {
  private api = inject(WorkspaceApi);
  private storage = 'tracecore.documents.pending';
  readonly rows = signal<PendingDocument[]>([]);
  constructor() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.storage) ?? '[]');
      if (Array.isArray(saved)) this.rows.set(saved.filter(validPending));
    } catch {
      sessionStorage.removeItem(this.storage);
    }
    this.api.session.ended.subscribe(() => {
      this.rows.set([]);
      sessionStorage.removeItem(this.storage);
    });
  }
  own() {
    return this.rows().filter((p) => p.actor === this.api.session.user()?.uuid);
  }
  private save() {
    sessionStorage.setItem(this.storage, JSON.stringify(this.rows()));
  }
  track(
    operation: PendingDocument['operation'],
    path: string,
    payload: Record<string, unknown>,
    extra: Partial<PendingDocument> = {},
  ) {
    const actor = this.api.session.user()?.uuid,
      key = String(payload['uuid'] ?? payload['versionUuid']);
    if (!actor || !uuidPattern.test(key) || !this.api.session.valid())
      throw new Error('Sesión o UUID inválido.');
    const row = { ...extra, actor, key, operation, path, payload: structuredClone(payload) };
    if (!validPending(row)) throw new Error('Solicitud inválida.');
    this.rows.update((items) => [...items.filter((p) => p.actor !== actor || p.key !== key), row]);
    this.save();
    return row;
  }
  remove(row: PendingDocument) {
    this.rows.update((items) => items.filter((p) => p.actor !== row.actor || p.key !== row.key));
    this.save();
  }
  async repeat(row: PendingDocument) {
    this.authorize(row);
    if (row.operation === 'UPLOAD')
      throw new Error('Selecciona el archivo original y consulta la versión antes de repetir.');
    try {
      const result = await this.api.post(row.path, row.payload);
      this.authorize(row);
      this.remove(row);
      return result;
    } catch (e) {
      if (definiteFailure(e)) this.remove(row);
      throw e;
    }
  }
  async recover(row: PendingDocument) {
    this.authorize(row);
    const path =
      row.operation === 'CREATE'
        ? '/documents/' + row.key + '/summary'
        : row.operation === 'LINK'
          ? '/documents/links/' + row.payload['subjectKind'] + '/' + row.key
          : '/documents/versions/' + row.key;
    const result = await this.api.get(path);
    this.authorize(row);
    this.remove(row);
    return result;
  }
  private authorize(row: PendingDocument) {
    if (
      row.actor !== this.api.session.user()?.uuid ||
      !this.api.session.valid() ||
      !validPending(row)
    )
      throw new Error('Solicitud de otra sesión.');
  }
}
