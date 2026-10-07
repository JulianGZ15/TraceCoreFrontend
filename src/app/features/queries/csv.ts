import { signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { WorkspaceApi, Params } from '../../core/http/workspace-api';
export function csvContinuation(h: { get(name: string): string | null }) {
  const offset = h.get('X-Offset'),
    limit = h.get('X-Limit'),
    more = h.get('X-Has-More'),
    next = h.get('X-Next-Offset'),
    at = h.get('X-Generated-At');
  if (
    !offset ||
    !limit ||
    !/^\d+$/.test(offset) ||
    !/^\d+$/.test(limit) ||
    !['true', 'false'].includes(more ?? '') ||
    !at ||
    !Number.isFinite(Date.parse(at)) ||
    (more === 'true' &&
      (!next || !/^\d+$/.test(next) || Number(next) !== Number(offset) + Number(limit)))
  )
    throw new Error('API incompatible: faltan cabeceras de continuación CSV.');
  return {
    next: more === 'true' ? Number(next) : null,
    at,
    offset: Number(offset),
    limit: Number(limit),
  };
}
export class CsvDownload {
  readonly busy = signal(false);
  readonly next = signal<number | null>(null);
  readonly at = signal('');
  readonly error = signal('');
  private stop = new Subject<void>();
  private generation = 0;
  private ended: Subscription;
  constructor(private api: WorkspaceApi) {
    this.ended = api.session.ended.subscribe(() => this.reset());
  }
  reset() {
    this.generation++;
    this.stop.next();
    this.next.set(null);
    this.at.set('');
    this.busy.set(false);
    this.error.set('');
  }
  async download(path: string, params: Params, next = false) {
    if (this.busy()) return;
    const generation = this.generation,
      epoch = this.api.session.epoch();
    this.busy.set(true);
    this.error.set('');
    try {
      const h = await this.api.download(
        path,
        path.split('/').at(-1) ?? 'consulta.csv',
        { ...params, offset: next ? (this.next() ?? 0) : 0, limit: 500 },
        this.stop,
      );
      if (!h || generation !== this.generation || epoch !== this.api.session.epoch()) return;
      const c = csvContinuation(h);
      this.next.set(c.next);
      this.at.set(c.at);
    } catch (e) {
      if (generation === this.generation)
        this.error.set(e instanceof Error ? e.message : 'No se pudo exportar.');
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }
  destroy() {
    this.ended.unsubscribe();
    this.reset();
    this.stop.complete();
  }
}
