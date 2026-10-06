import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FinanceApi } from './finance-api';
import { Pending, Operation } from './models';
const paths: Record<Operation, string> = {
  CURRENCY: '/currencies',
  CHARGE: '/charges',
  INVOICE: '/invoices',
  CREDIT_NOTE: '/credit-notes',
  PAYMENT: '/payments',
  ALLOCATION: '/payment-allocations',
  ACCOUNT: '/credit-accounts',
  REVERSAL: '/reversals',
};
@Injectable({ providedIn: 'root' })
export class FinancePending {
  readonly api = inject(FinanceApi);
  readonly rows = signal<Pending[]>([]);
  private storage = 'tracecore.finance.pending';
  constructor() {
    try {
      const data = JSON.parse(sessionStorage.getItem(this.storage) ?? '[]');
      if (Array.isArray(data))
        this.rows.set(
          data.filter(
            (p) =>
              p &&
              typeof p.actor === 'string' &&
              typeof p.key === 'string' &&
              /^[a-f0-9-]{36}$/i.test(p.key) &&
              paths[p.operation as Operation] === p.path &&
              p.payload &&
              p.payload.uuid === p.key,
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
    return this.rows().filter((p) => p.actor === this.api.session.user()?.uuid);
  }
  private persist() {
    sessionStorage.setItem(this.storage, JSON.stringify(this.rows()));
  }
  async create<T>(operation: Operation, path: string, payload: Record<string, unknown>) {
    const actor = this.api.session.user()?.uuid;
    if (
      !actor ||
      !this.api.session.valid() ||
      paths[operation] !== path ||
      typeof payload['uuid'] !== 'string'
    )
      throw new Error('Solicitud recuperable inválida.');
    const key = payload['uuid'];
    if (this.own().some((p) => p.operation === operation && p.key === key))
      throw new Error('Consulta o repite manualmente la solicitud pendiente.');
    const p: Pending = {
      actor,
      key,
      operation,
      path,
      payload: structuredClone(payload),
      createdAt: new Date().toISOString(),
    };
    this.rows.update((rows) => [...rows, p]);
    this.persist();
    return this.repeat<T>(p);
  }
  async repeat<T>(p: Pending) {
    this.authorize(p);
    try {
      const r = await this.api.post<T>(p.path, p.payload);
      this.authorize(p);
      this.remove(p);
      return r;
    } catch (e) {
      if (e instanceof HttpErrorResponse && [400, 401, 403, 404, 409, 413].includes(e.status))
        this.remove(p);
      throw e;
    }
  }
  async recover(p: Pending) {
    this.authorize(p);
    const r = await this.api.get('/requests/' + p.key, { operation: p.operation });
    this.authorize(p);
    this.remove(p);
    return r;
  }
  private authorize(p: Pending) {
    if (
      p.actor !== this.api.session.user()?.uuid ||
      !this.api.session.valid() ||
      paths[p.operation] !== p.path
    )
      throw new Error('Solicitud de otra sesión.');
  }
  remove(p: Pending) {
    this.rows.update((rows) => rows.filter((r) => r.key !== p.key || r.operation !== p.operation));
    this.persist();
  }
}
