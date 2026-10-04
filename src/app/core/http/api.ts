import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export const API_BASE = new InjectionToken<string>('API_BASE', { factory: () => '/api/v1' });
export interface User {
  uuid: string;
  name: string;
  email: string;
  active: boolean;
  version: number;
}
export interface Company {
  uuid: string;
  legalName: string;
  name: string;
  country: string;
  timezone: string;
  active: boolean;
  version: number;
}
export interface Yard {
  uuid: string;
  companyUuid: string;
  code: string;
  name: string;
  address: string;
  timezone: string;
  active: boolean;
  version: number;
}
export interface Role {
  uuid: string;
  code: string;
  name: string;
  version: number;
}
export interface Permission {
  uuid: string;
  code: string;
}
export interface RolePermission {
  uuid: string;
  roleUuid: string;
  permissionUuid: string;
}
export interface Assignment {
  uuid: string;
  userUuid: string;
  roleUuid: string;
  scopeType: 'COMPANY' | 'YARD';
  companyUuid: string;
  yardUuid: string | null;
  validFrom: string;
  validTo: string | null;
  revokedAt: string | null;
  version: number;
}
export interface Audit {
  uuid: string;
  actorUuid: string | null;
  action: string;
  resourceType: string;
  resourceUuid: string;
  occurredAt: string;
  recordedAt: string;
  correlationUuid: string;
  changedFields: string[];
}
export interface Context {
  company: Pick<Company, 'uuid' | 'name' | 'timezone' | 'active'>;
  companyPermissions: string[];
  yards: (Pick<Yard, 'uuid' | 'companyUuid' | 'code' | 'name' | 'timezone' | 'active'> & {
    permissions: string[];
  })[];
}
export interface Login {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  readonly base = inject(API_BASE).replace(/\/$/, '');
  get<T>(path: string, params: Record<string, string | number> = {}) {
    return firstValueFrom(
      this.http.get<T>(this.base + path, { params: new HttpParams({ fromObject: params }) }),
    );
  }
  post<T>(path: string, body: unknown) {
    return firstValueFrom(this.http.post<T>(this.base + path, body));
  }
  put<T>(path: string, body: unknown) {
    return firstValueFrom(this.http.put<T>(this.base + path, body));
  }
  delete(path: string) {
    return firstValueFrom(this.http.delete<void>(this.base + path));
  }
  async all<T>(path: string): Promise<T[]> {
    const result: T[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await this.get<T[]>(path, { offset, limit: 100 });
      result.push(...page);
      if (page.length < 100) return result;
    }
  }
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse))
    return 'No pudimos completar la operación. Inténtalo de nuevo.';
  switch (error.status) {
    case 0:
      return 'No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    case 400:
      return 'El servidor no aceptó los datos. Revisa los campos antes de enviar.';
    case 401:
      return 'Tu sesión finalizó. Inicia sesión de nuevo.';
    case 403:
      return 'No tienes permiso para esta operación. Revisa tus accesos o contacta al administrador.';
    case 404:
      return 'El registro ya no está disponible.';
    case 409:
      return 'No se pudo guardar: hay un conflicto de datos, vigencia o versión. Conservamos tus cambios; puedes recargar los datos.';
    case 413:
      return 'El archivo supera el tamaño permitido de 10 MiB.';
    case 503:
      return 'El almacenamiento no está disponible. Conservamos tu selección; comprueba la lista antes de volver a cargar.';
    default:
      return 'El servidor no pudo completar la operación. Puedes intentar de nuevo.';
  }
}
