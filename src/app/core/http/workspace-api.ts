import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, merge, Subject, takeUntil } from 'rxjs';
import { Api, errorMessage as apiError } from './api';
import { Session } from '../auth/session';
export type Params = Record<string, string | number | boolean | null | undefined>;
export function workspaceError(error: unknown) {
  return error instanceof Error && !(error instanceof HttpErrorResponse)
    ? error.message
    : apiError(error);
}
export interface Page<T> {
  items: T[];
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
}
@Injectable({ providedIn: 'root' })
export class WorkspaceApi {
  private injector = inject(Injector);
  private get http() {
    return this.injector.get(HttpClient);
  }
  readonly session = inject(Session);
  get base() {
    return this.injector.get(Api).base;
  }
  private params(values: Params) {
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(values))
      if (value != null && value !== '') clean[key] = String(value);
    return new HttpParams({ fromObject: clean });
  }
  get<T>(path: string, params: Params = {}, stop?: Subject<void>) {
    return firstValueFrom(
      this.http
        .get<T>(this.base + path, { params: this.params(params) })
        .pipe(takeUntil(stop ? merge(stop, this.session.ended) : this.session.ended)),
    );
  }
  post<T>(path: string, body: unknown, params: Params = {}) {
    return firstValueFrom(
      this.http
        .post<T>(this.base + path, body, { params: this.params(params) })
        .pipe(takeUntil(this.session.ended)),
    );
  }
  async download(path: string, name: string, params: Params = {}, stop?: Subject<void>) {
    const response = await firstValueFrom(
      this.http
        .get(this.base + path, {
          params: this.params(params),
          responseType: 'blob',
          observe: 'response',
        })
        .pipe(takeUntil(stop ? merge(stop, this.session.ended) : this.session.ended)),
    );
    if (!this.session.valid() || !response.body) return null;
    const url = URL.createObjectURL(response.body);
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
    return response.headers;
  }
}
