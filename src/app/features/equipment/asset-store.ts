import { Injectable, inject, signal } from '@angular/core';

import { EquipmentApi } from './equipment-api';

import { Profile } from './models';

import { Session } from '../../core/auth/session';

@Injectable()

export class AssetStore {

  readonly api=inject(EquipmentApi);readonly session=inject(Session);readonly profile=signal<Profile|null>(null);uuid='';private generation=0;

  async load(uuid=this.uuid){const generation=++this.generation,epoch=this.session.epoch();if(uuid!==this.uuid)this.profile.set(null);this.uuid=uuid;const profile=await this.api.profile(uuid);if(generation===this.generation&&epoch===this.session.epoch())this.profile.set(profile);}

  dispose(){++this.generation;this.profile.set(null);}

}

