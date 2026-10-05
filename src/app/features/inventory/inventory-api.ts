import { Injectable, inject } from '@angular/core';
import { Api } from '../../core/http/api';
@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly api = inject(Api);
  get<T>(path: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
    const values: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params))
      if (v !== null && v !== undefined && v !== '')
        values[k] = typeof v === 'boolean' ? String(v) : v;
    return this.api.get<T>('/inventory' + path, values);
  }
  post<T>(path: string, body: unknown) {
    return this.api.post<T>('/inventory' + path, body);
  }
  put<T>(path: string, body: unknown) {
    return this.api.put<T>('/inventory' + path, body);
  }
}
