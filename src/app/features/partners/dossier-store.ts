import { Injectable, inject, signal } from '@angular/core';
import { PartnersApi } from './partners-api';
import { Party, Role } from './models';
import { Session } from '../../core/auth/session';
@Injectable()
export class DossierStore {
  private api = inject(PartnersApi);
  private session = inject(Session);
  readonly party = signal<Party | null>(null);
  readonly roles = signal<Role[]>([]);
  private generation = 0;
  uuid = '';
  async load(uuid = this.uuid) {
    const changed = this.uuid !== uuid;
    this.uuid = uuid;
    const generation = ++this.generation,
      epoch = this.session.epoch();
    if (changed) {
      this.party.set(null);
      this.roles.set([]);
    }
    const [party, roles] = await Promise.all([
      this.api.party(uuid),
      this.api.list<Role>(uuid, 'roles'),
    ]);
    if (generation === this.generation && epoch === this.session.epoch()) {
      this.party.set(party);
      this.roles.set(roles);
    }
  }
  dispose() {
    ++this.generation;
    this.party.set(null);
    this.roles.set([]);
  }
}
