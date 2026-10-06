import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, merge, Subject, takeUntil } from 'rxjs';
import { Api } from '../../core/http/api';
import { Session } from '../../core/auth/session';
@Injectable({ providedIn: 'root' })
export class LogisticsApi {
  private readonly http = inject(HttpClient);
  readonly base = inject(Api).base + '/logistics';
  readonly session = inject(Session);
  get<T>(
    path: string,
    params: Record<string, string | number | null | undefined> = {},
    stop?: Subject<void>,
  ) {
    const clean: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') clean[k] = v;
    return firstValueFrom(
      this.http
        .get<T>(this.base + path, { params: new HttpParams({ fromObject: clean }) })
        .pipe(takeUntil(stop ? merge(stop, this.session.ended) : this.session.ended)),
    );
  }
  prepare<T>(payload: unknown) {
    return firstValueFrom(
      this.http
        .post<T>(this.base.replace(/logistics$/, 'inventory') + '/movements', payload)
        .pipe(takeUntil(this.session.ended)),
    );
  }
  post<T>(path: string, payload: unknown) {
    return firstValueFrom(
      this.http.post<T>(this.base + path, payload).pipe(takeUntil(this.session.ended)),
    );
  }
  put<T>(path: string, payload: unknown) {
    return firstValueFrom(
      this.http.put<T>(this.base + path, payload).pipe(takeUntil(this.session.ended)),
    );
  }
  upload(file: File, id: string) {
    if (
      !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    )
      throw new Error('Archivo PDF, PNG o JPEG de hasta 10 MiB.');
    const form = new FormData();
    form.append('file', file);
    return firstValueFrom(
      this.http
        .post<import('./models').Entity>(this.base + '/manifests/' + id + '/evidence', form)
        .pipe(takeUntil(this.session.ended)),
    );
  }
  async download(id: string, name: string) {
    const blob = await firstValueFrom(
      this.http
        .get(this.base + '/evidence/' + id + '/content', { responseType: 'blob' })
        .pipe(takeUntil(this.session.ended)),
    );
    if (!this.session.valid()) return;
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
