import { signal } from '@angular/core';
import { Api, errorMessage } from '../../core/http/api';
export class PageList<T> {
  readonly items = signal<T[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly offset = signal(0);
  readonly limit = signal(25);
  private generation = 0;
  constructor(
    private api: Api,
    private path: string,
  ) {}
  async load(offset = this.offset()) {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const data = await this.api.get<T[]>(this.path, { offset, limit: this.limit() });
      if (generation !== this.generation) return;
      if (!data.length && offset > 0) {
        this.success.set('No hay más registros.');
        return;
      }
      this.items.set(data);
      this.offset.set(offset);
    } catch (e) {
      if (generation === this.generation) this.error.set(errorMessage(e));
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }
  resize(limit: number) {
    this.limit.set(limit);
    return this.load(0);
  }
}
