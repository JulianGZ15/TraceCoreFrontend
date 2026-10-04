import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Api } from '../../core/http/api';
import {
  Party,
  PartyData,
  Kind,
  Resource,
  fullLists,
  Evidence,
  QuotaYard,
  Eligibility,
  Operation,
} from './models';
@Injectable({ providedIn: 'root' })
export class PartnersApi {
  private api = inject(Api);
  private http = inject(HttpClient);
  path(party: string, kind?: Kind) {
    return '/parties/' + party + (kind ? '/' + kind : '');
  }
  party(uuid: string) {
    return this.api.get<Party>(this.path(uuid));
  }
  directory(params: Record<string, string | number>) {
    return this.api.get<Party[]>('/parties', params);
  }
  createParty(data: PartyData) {
    return this.api.post<Party>('/parties', data);
  }
  updateParty(uuid: string, data: PartyData, version: number) {
    return this.api.put<Party>(this.path(uuid), { ...data, version });
  }
  list<T extends Resource>(
    party: string,
    kind: Kind,
    offset = 0,
    limit = 25,
    filters: Record<string, string | number> = {},
  ) {
    return this.api.get<T[]>(
      this.path(party, kind),
      fullLists.includes(kind) ? filters : { ...filters, offset, limit },
    );
  }
  create<T extends Resource>(party: string, kind: Kind, data: unknown) {
    return this.api.post<T>(this.path(party, kind), data);
  }
  update<T extends Resource>(party: string, kind: Kind, uuid: string, data: unknown) {
    return this.api.put<T>(this.path(party, kind) + '/' + uuid, data);
  }
  action<T extends Resource>(
    party: string,
    kind: Kind,
    uuid: string,
    action: string,
    data: unknown,
  ) {
    return this.api.post<T>(this.path(party, kind) + '/' + uuid + '/' + action, data);
  }
  async find<T extends Resource>(party: string, kind: Kind, uuid: string): Promise<T> {
    for (let offset = 0; ; offset += 100) {
      const rows = await this.list<T>(party, kind, offset, 100);
      const row = rows.find((r) => r.uuid === uuid);
      if (row) return row;
      if (fullLists.includes(kind) || rows.length < 100)
        throw new Error('El registro ya no está disponible.');
    }
  }
  yards(offset = 0, limit = 25) {
    return this.api.get<QuotaYard[]>('/parties/quota-yards', { offset, limit });
  }
  eligibility(party: string, operation: Operation, scope: string) {
    return this.api.get<Eligibility>(
      this.path(party) + '/eligibility',
      operation === 'OC' ? { operation, avlScope: scope.toUpperCase() } : { operation },
    );
  }
  upload(party: string, file: File) {
    if (file.size > 10485760) throw new Error('El archivo supera el máximo de 10 MiB.');
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name) || /[/\\\x00-\x1f\x7f]/.test(file.name))
      throw new Error('Selecciona un PDF, PNG o JPEG con un nombre válido.');
    const data = new FormData();
    data.append('file', file, file.name);
    return this.api.post<Evidence>(this.path(party, 'evidence'), data);
  }
  async download(party: string, evidence: Evidence) {
    const blob = await firstValueFrom(
      this.http.get(
        this.api.base + this.path(party, 'evidence') + '/' + evidence.uuid + '/content',
        { responseType: 'blob' },
      ),
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = evidence.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
