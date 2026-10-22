import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, merge, Subject, takeUntil } from 'rxjs';
import { Api } from '../../core/http/api';
import { Session } from '../../core/auth/session';
import { EquipmentPhoto, PhotoEvent, PhotoPage } from './photos.models';

@Injectable({ providedIn: 'root' })
export class PhotosApi {
  private readonly http = inject(HttpClient);
  private readonly api = inject(Api);
  private readonly session = inject(Session);
  private path(asset: string, suffix = '') { return this.api.base + '/equipment/assets/' + asset + '/photos' + suffix; }
  private end(stop: Subject<void>) { return merge(stop, this.session.ended); }
  async list(asset: string, state: string, offset: number, stop: Subject<void>, query = false): Promise<PhotoPage<EquipmentPhoto>> {
    if (query) {
      const result = await firstValueFrom(this.http.get<{ authorized: boolean; data: PhotoPage<EquipmentPhoto> }>(
        this.api.base + '/queries/equipment/' + asset + '/sections/photos',
        { params: { collection: state === 'ARCHIVED' ? 'archived' : 'files', offset, limit: 25 } },
      ).pipe(takeUntil(this.end(stop))));
      if (!result.authorized) throw new Error('Sin permiso para consultar las fotos.');
      return result.data;
    }
    return firstValueFrom(this.http.get<PhotoPage<EquipmentPhoto>>(this.path(asset), { params: { state, offset, limit: 25 } }).pipe(takeUntil(this.end(stop))));
  }
  detail(asset: string, photo: string, stop: Subject<void>) {
    return firstValueFrom(this.http.get<EquipmentPhoto>(this.path(asset, '/' + photo)).pipe(takeUntil(this.end(stop))));
  }
  history(asset: string, photo: string, offset: number, stop: Subject<void>) {
    return firstValueFrom(this.http.get<PhotoPage<PhotoEvent>>(this.path(asset, '/' + photo + '/history'), { params: { offset, limit: 10 } }).pipe(takeUntil(this.end(stop))));
  }
  async image(asset: string, photo: string, variant: string, stop: Subject<void>): Promise<Blob> {
    const response = await firstValueFrom(this.http.get(this.path(asset, '/' + photo + '/content'), {
      params: { variant }, responseType: 'blob', observe: 'response',
    }).pipe(takeUntil(this.end(stop))));
    if (!this.session.valid() || !response.body || !['image/jpeg', 'image/png'].includes(response.body.type)
      || !response.headers.get('Cache-Control')?.toLowerCase().includes('no-store')
      || response.headers.get('X-Content-Type-Options')?.toLowerCase() !== 'nosniff') throw new Error('La imagen recibida no es válida.');
    return response.body;
  }
  upload(asset: string, data: FormData, stop: Subject<void>) {
    return firstValueFrom(this.http.post<EquipmentPhoto>(this.path(asset), data).pipe(takeUntil(this.end(stop))));
  }
  correct(asset: string, photo: string, body: unknown, stop: Subject<void>) {
    return firstValueFrom(this.http.put<EquipmentPhoto>(this.path(asset, '/' + photo), body).pipe(takeUntil(this.end(stop))));
  }
  transition(asset: string, photo: EquipmentPhoto, reason: string, stop: Subject<void>) {
    return firstValueFrom(this.http.post<EquipmentPhoto>(this.path(asset, '/' + photo.uuid + '/' + (photo.state === 'ACTIVE' ? 'archive' : 'restore')),
      { version: photo.version, reason }).pipe(takeUntil(this.end(stop))));
  }
}
