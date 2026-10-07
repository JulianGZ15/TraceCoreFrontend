import { Injectable, inject } from '@angular/core';
import { Api } from '../../core/http/api';

@Injectable({ providedIn: 'root' })
export class EntityLabelResolver {
  private api = inject(Api);
  private cache = new Map<string, string>();
  private inFlight = new Map<string, Promise<string>>();

  get(uuid: string): string | undefined {
    return this.cache.get(uuid);
  }

  set(uuid: string, label: string): void {
    if (uuid && label) {
      this.cache.set(uuid, label);
    }
  }

  async resolveParty(uuid: string): Promise<string> {
    if (!uuid) return '';
    if (this.cache.has(uuid)) return this.cache.get(uuid)!;
    const key = `party:${uuid}`;
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;

    const promise = (async () => {
      try {
        const options = await this.api.get<
          {
            uuid?: string;
            label?: string;
            record?: { uuid: string; legalName?: string; tradeName?: string };
          }[]
        >('/party-options', { limit: 100 });
        const match = options.find((o) => (o.uuid || o.record?.uuid) === uuid);
        if (match) {
          const label = match.label || match.record?.tradeName || match.record?.legalName || uuid;
          this.cache.set(uuid, label);
          return label;
        }

        const parties = await this.api.get<
          { uuid: string; legalName?: string; tradeName?: string }[]
        >('/parties/directory', { limit: 100 });
        const pMatch = parties.find((p) => p.uuid === uuid);
        if (pMatch) {
          const label = pMatch.tradeName || pMatch.legalName || uuid;
          this.cache.set(uuid, label);
          return label;
        }
      } catch {
        // Fall back gracefully
      }
      return uuid.length > 8 ? `${uuid.slice(0, 8)}…` : uuid;
    })();

    this.inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  async resolveUser(uuid: string): Promise<string> {
    if (!uuid) return '';
    if (this.cache.has(uuid)) return this.cache.get(uuid)!;
    const key = `user:${uuid}`;
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;

    const promise = (async () => {
      try {
        const users = await this.api.get<{ uuid: string; name?: string; label?: string }[]>(
          '/user-options',
          { limit: 100 },
        );
        const match = users.find((u) => u.uuid === uuid);
        if (match) {
          const label = match.name || match.label || uuid;
          this.cache.set(uuid, label);
          return label;
        }
      } catch {
        // Fall back gracefully
      }
      return uuid.length > 8 ? `${uuid.slice(0, 8)}…` : uuid;
    })();

    this.inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  async resolve(kind: string, uuid: string): Promise<string> {
    if (!uuid) return '';
    if (this.cache.has(uuid)) return this.cache.get(uuid)!;
    if (kind === 'party') return this.resolveParty(uuid);
    if (kind === 'user') return this.resolveUser(uuid);
    return uuid.length > 8 ? `${uuid.slice(0, 8)}…` : uuid;
  }
}
