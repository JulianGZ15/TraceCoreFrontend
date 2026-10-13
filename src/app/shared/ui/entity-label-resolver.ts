import { Injectable, inject } from '@angular/core';
import { Api } from '../../core/http/api';
import { Session } from '../../core/auth/session';

@Injectable({ providedIn: 'root' })
export class EntityLabelResolver {
  private api = inject(Api);
  private session = inject(Session);
  private cache = new Map<string, string>();
  private inFlight = new Map<string, Promise<string>>();
  private partyNamesInFlight = new Map<string, Promise<string | null>>();

  async resolveReference(kind: 'company' | 'party', uuid: string): Promise<string | null> {
    if (!uuid) return null;
    if (kind === 'company') {
      const company = this.session.context()?.company;
      return company?.uuid === uuid ? company.name || null : null;
    }

    const key = `party:${uuid}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    if (this.partyNamesInFlight.has(key)) return this.partyNamesInFlight.get(key)!;

    const promise = this.api
      .get<{ uuid: string; legalName?: string; tradeName?: string }>('/parties/' + uuid)
      .then((party) => {
        const label = party.tradeName?.trim() || party.legalName?.trim() || null;
        if (label) this.cache.set(key, label);
        return label;
      })
      .catch(() => null);

    this.partyNamesInFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.partyNamesInFlight.delete(key);
    }
  }

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
    const key = `party:${uuid}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    if (this.inFlight.has(key)) return this.inFlight.get(key)!;

    const promise = (async () => {
      try {
        const exact = await this.api.get<{
          uuid: string;
          legalName?: string;
          tradeName?: string;
        }>('/parties/' + uuid);
        const exactLabel = exact.tradeName?.trim() || exact.legalName?.trim();
        if (exactLabel) {
          this.cache.set(key, exactLabel);
          return exactLabel;
        }
      } catch {
        // Use the existing options lookup where the caller has only lookup access.
      }
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
          this.cache.set(key, label);
          return label;
        }

        const parties = await this.api.get<
          { uuid: string; legalName?: string; tradeName?: string }[]
        >('/parties/directory', { limit: 100 });
        const pMatch = parties.find((p) => p.uuid === uuid);
        if (pMatch) {
          const label = pMatch.tradeName || pMatch.legalName || uuid;
          this.cache.set(key, label);
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
    const key = `user:${uuid}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
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
          this.cache.set(key, label);
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
    const key = `${kind}:${uuid}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    if (kind === 'party') return this.resolveParty(uuid);
    if (kind === 'user') return this.resolveUser(uuid);
    return uuid.length > 8 ? `${uuid.slice(0, 8)}…` : uuid;
  }
}
