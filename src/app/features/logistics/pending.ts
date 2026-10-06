const uuid = '[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}';
const paths: Record<string, string> = {
  MOVEMENT: '/movements',
  MANIFEST: '/manifests',
  CHECK: '/manifests/' + uuid + '/checks',
  DISPATCH: '/manifests/' + uuid + '/dispatch',
  RECEIPT: '/manifests/' + uuid + '/receipts',
  MILESTONE: '/manifests/' + uuid + '/milestones',
};
function validPath(operation: string, path: string) {
  return !!paths[operation] && new RegExp('^' + paths[operation] + '$', 'i').test(path);
}
import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LogisticsApi } from './logistics-api';
import { Pending } from './models';
@Injectable({ providedIn: 'root' })
export class LogisticsPending {
  readonly api = inject(LogisticsApi);
  readonly rows = signal<Pending[]>([]);
  private storage = 'tracecore.logistics.pending';
  constructor() {
    try {
      const data = JSON.parse(sessionStorage.getItem(this.storage) ?? '[]');
      if (Array.isArray(data))
        this.rows.set(
          data.filter(
            (r) =>
              r &&
              typeof r.actor === 'string' &&
              typeof r.key === 'string' &&
              typeof r.path === 'string' &&
              validPath(r.operation, r.path) &&
              r.payload,
          ),
        );
    } catch {
      sessionStorage.removeItem(this.storage);
    }
    this.api.session.ended.subscribe(() => {
      this.rows.set([]);
      sessionStorage.removeItem(this.storage);
    });
  }
  own() {
    return this.rows().filter((r) => r.actor === this.api.session.user()?.uuid);
  }
  private persist() {
    sessionStorage.setItem(this.storage, JSON.stringify(this.rows()));
  }
  async create<T>(operation: string, path: string, payload: Record<string, unknown>) {
    if (!validPath(operation, path)) throw new Error('Operación recuperable desconocida.');
    const actor = this.api.session.user()?.uuid;
    if (!actor || !this.api.session.valid()) throw new Error('La sesión finalizó.');
    const key = String(
      payload['uuid'] ??
        payload['requestKey'] ??
        (payload['line'] as { uuid?: string } | undefined)?.uuid ??
        '',
    );
    if (!key) throw new Error('La solicitud necesita UUID o requestKey.');
    if (this.own().some((r) => r.key === key || r.path === path))
      throw new Error('Consulta la solicitud pendiente antes de repetir.');
    const p = {
      actor,
      key,
      operation,
      path,
      payload: structuredClone(payload),
      createdAt: new Date().toISOString(),
    };
    this.rows.update((r) => [...r, p]);
    this.persist();
    return this.repeat<T>(p);
  }
  async repeat<T>(p: Pending) {
    if (p.actor !== this.api.session.user()?.uuid || !this.api.session.valid())
      throw new Error('Solicitud de otra sesión.');
    try {
      const result =
        p.operation === 'MOVEMENT'
          ? await this.api.prepare<T>(p.payload)
          : await this.api.post<T>(p.path, p.payload);
      if (!this.api.session.valid() || p.actor !== this.api.session.user()?.uuid)
        throw new Error('La sesión finalizó.');
      this.remove(p.key);
      return result;
    } catch (e) {
      if (e instanceof HttpErrorResponse && [400, 401, 403, 404, 409, 413].includes(e.status))
        this.remove(p.key);
      throw e;
    }
  }
  async recover(p: Pending) {
    if (p.actor !== this.api.session.user()?.uuid) throw new Error('Solicitud de otro actor.');
    const result = await this.api.get('/requests/' + p.key, { operation: p.operation });
    this.remove(p.key);
    return result;
  }
  remove(key: string) {
    this.rows.update((r) => r.filter((v) => v.key !== key));
    this.persist();
  }
}
