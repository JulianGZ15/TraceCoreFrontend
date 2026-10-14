import { Component, input, output, inject, signal, effect, untracked, OnDestroy } from '@angular/core';
import { RfidApi } from '../../rfid-api';
import { Session } from '../../../../core/auth/session';
import { Subject } from 'rxjs';
import { Feedback } from '../../../../shared/ui/page';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
import * as M from '../../models';
type Kind = 'READERS' | 'DEVICES' | 'ANTENNAS' | 'ASSETS' | 'GATES' | 'MODELS' | 'CONFIG_READERS' | 'COUNTS' | 'LOCATIONS';
@Component({ selector: 'tc-rfid-picker', imports: [EntitySearchComponent, Feedback], templateUrl: './scan-picker.component.html', styleUrl: './scan-picker.component.scss' })
export class ScanPickerComponent implements OnDestroy {
  readonly kind = input.required<Kind>(); readonly yardUuid = input(''); readonly readerUuid = input(''); readonly value = input('');
  readonly label = input('Seleccionar'); readonly disabled = input(false); readonly selected = output<string>();
  readonly selectedLabel = signal(''); readonly busy = signal(false); readonly error = signal('');
  readonly searchFn = (search: string) => this.search(search);
  private api = inject(RfidApi); private session = inject(Session); private generation = 0; private stop = new Subject<void>(); private context = '';
  constructor() {
    effect(() => {
      const context = [this.kind(), this.yardUuid(), this.readerUuid(), this.session.epoch()].join(':');
      untracked(() => { if (context !== this.context) { this.context = context; this.selectedLabel.set(''); } });
    });
  }
  async search(search: string): Promise<EntityOption[]> {
    const generation = ++this.generation, epoch = this.session.epoch(), kind = this.kind();
    this.stop.next(); this.busy.set(true); this.error.set('');
    try {
      const params = { yardUuid: this.yardUuid(), readerUuid: this.readerUuid(), search, offset: 0, limit: 25 };
      let options: EntityOption[] = [];
      if (['READERS', 'DEVICES', 'ANTENNAS'].includes(kind)) {
        if (!this.yardUuid() || (kind !== 'READERS' && !this.readerUuid())) return [];
        const remote = await this.api.get<M.Remote>('/scan-options/' + kind, params, this.stop);
        if (!remote.available) throw new Error('Servicio RFID no disponible.');
        options = remote.rows.map(r => ({ value: r.uuid, label: r.reader ? r.reader.code + ' · ' + r.reader.name : r.antenna ? 'Puerto ' + r.antenna.port + ' · ' + r.antenna.name : (r.device?.kind ?? 'Dispositivo') + ' · Equipo' }));
      } else if (kind === 'CONFIG_READERS') {
        const remote = await this.api.get<M.Remote>('/reader-directory', params, this.stop);
        if (!remote.available) throw new Error('Servicio RFID no disponible.');
        options = remote.rows.map(r => ({ value: r.uuid, label: r.reader!.code + ' · ' + r.reader!.name }));
      } else if (kind === 'ASSETS') {
        const rows = await this.api.get<M.Asset[]>('/assets', params, this.stop);
        options = rows.map(r => ({ value: r.identity.uuid, label: r.identity.internalCode + ' · ' + (r.identity.serialNumber ?? 'Sin serial') }));
      } else if (kind === 'GATES') {
        const rows = await this.api.get<M.Local<M.Gate>[]>('/gates', params, this.stop);
        options = rows.filter(r => r.data.active).map(r => ({ value: r.data.uuid, label: r.data.code + ' · ' + r.data.name }));
      } else if (kind === 'MODELS') {
        const rows = await this.api.get<M.Local<M.TagModel>[]>('/tag-models', params, this.stop);
        options = rows.filter(r => r.data.active).map(r => ({ value: r.data.uuid, label: r.data.manufacturer + ' · ' + r.data.model }));
      } else {
        if (!this.yardUuid()) return [];
        const rows = await this.api.inventory<{ uuid: string; code: string; name?: string; state?: string }[]>(kind === 'COUNTS' ? '/counts' : '/locations', params, this.stop);
        options = rows.filter(r => kind !== 'COUNTS' || r.state === 'OPEN').map(r => ({ value: r.uuid, label: r.code + (r.name ? ' · ' + r.name : '') }));
      }
      if (generation !== this.generation || epoch !== this.session.epoch()) return [];
      const normalized = search.trim().toLocaleLowerCase();
      const result = normalized ? options.filter(o => o.label.toLocaleLowerCase().includes(normalized)) : options;
      return result.slice(0, 25);
    } catch (e) {
      if (generation === this.generation) this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las opciones.');
      return [];
    } finally { if (generation === this.generation) this.busy.set(false); }
  }
  choose(option: EntityOption | null) { this.selectedLabel.set(option?.label ?? ''); this.selected.emit(option?.value ?? ''); }
  ngOnDestroy() { ++this.generation; this.stop.next(); this.stop.complete(); }
}
