import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Session } from '../../core/auth/session';
import { QualityApi } from './quality-api';
import { CreationResource, Pending, Receipt, Versioned } from './models';
export const pendingKey = 'tracecore.quality.pending';
@Injectable({ providedIn: 'root' })
export class QualityPending {
  readonly session = inject(Session);
  private readonly api = inject(QualityApi);
  readonly rows = signal<Pending[]>([]);
  constructor() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(pendingKey) ?? '[]');
      if (Array.isArray(stored))
        this.rows.set(
          stored.filter(
            (v) =>
              v &&
              typeof v.actor === 'string' &&
              typeof v.key === 'string' &&
              ['inspections', 'maintenance', 'releases'].includes(v.resource) &&
              v.payload &&
              typeof v.payload === 'object',
          ),
        );
    } catch {
      sessionStorage.removeItem(pendingKey);
    }
    this.session.ended.subscribe(() => {
      this.rows.set([]);
      sessionStorage.removeItem(pendingKey);
    });
  }
  own() {
    return this.rows().filter((r) => r.actor === this.session.user()?.uuid);
  }
  private persist() {
    if (!this.session.valid()) {
      this.rows.set([]);
      sessionStorage.removeItem(pendingKey);
      return;
    }
    sessionStorage.setItem(pendingKey, JSON.stringify(this.rows()));
  }
  remove(key: string) {
    this.rows.update((r) => r.filter((v) => v.key !== key));
    this.persist();
  }
  async create<T extends Versioned>(
    resource: CreationResource,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const actor = this.session.user()?.uuid;
    if (!actor || !this.session.valid()) throw new Error('La sesión finalizó.');
    if (
      this.own().some(
        (r) => r.resource === resource && JSON.stringify(r.payload) === JSON.stringify(payload),
      )
    )
      throw new Error(
        'Esta solicitud sigue pendiente. Consulta el resultado o repite la misma solicitud desde el panel de pendientes.',
      );
    const r: Pending = {
      actor,
      key: crypto.randomUUID(),
      resource,
      payload: structuredClone(payload),
      createdAt: new Date().toISOString(),
    };
    this.rows.update((rows) => [...rows, r]);
    this.persist();
    return this.repeat<T>(r);
  }
  async repeat<T extends Versioned>(r: Pending): Promise<T> {
    if (r.actor !== this.session.user()?.uuid || !this.session.valid())
      throw new Error('Solicitud de otra sesión.');
    try {
      const result = await this.api.post<T>('/' + r.resource, r.payload, r.key);
      if (!this.session.valid() || r.actor !== this.session.user()?.uuid)
        throw new Error('La sesión finalizó.');
      this.remove(r.key);
      return result;
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status >= 400 && e.status < 500 && e.status !== 409)
        this.remove(r.key);
      throw e;
    }
  }
  async receipt(r: Pending) {
    const result = await this.api.get<Receipt>('/requests/' + r.key);
    this.remove(r.key);
    return result;
  }
}
