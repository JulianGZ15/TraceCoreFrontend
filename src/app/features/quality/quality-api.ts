import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Subject, merge, takeUntil } from 'rxjs';
import { Api } from '../../core/http/api';
import { Session } from '../../core/auth/session';
@Injectable({ providedIn: 'root' })
export class QualityApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(Api).base + '/quality';
  private readonly session = inject(Session);
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
  post<T>(path: string, data: unknown, key?: string) {
    return firstValueFrom(
      this.http
        .post<T>(this.base + path, data, { headers: key ? { 'Idempotency-Key': key } : {} })
        .pipe(takeUntil(this.session.ended)),
    );
  }
  put<T>(path: string, data: unknown) {
    return firstValueFrom(
      this.http.put<T>(this.base + path, data).pipe(takeUntil(this.session.ended)),
    );
  }
  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.post<import('./models').Evidence>('/evidence', form);
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
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
