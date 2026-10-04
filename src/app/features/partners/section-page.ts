import { Directive, inject, signal, OnInit, OnDestroy, Type } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { PartnersApi } from './partners-api';
import { DossierStore } from './dossier-store';
import { Kind, Resource, fullLists, Period, Verification } from './models';
import { Session } from '../../core/auth/session';
import { errorMessage } from '../../core/http/api';
import { confirm } from '../../shared/ui/editor';
import { label, validity, localDate, partnerError } from './rules';
@Directive()
export abstract class SectionPage<T extends Resource> implements OnInit, OnDestroy {
  readonly api = inject(PartnersApi);
  readonly store = inject(DossierStore);
  readonly session = inject(Session);
  readonly dialog = inject(Dialog);
  abstract readonly kind: Kind;
  readonly rows = signal<T[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly offset = signal(0);
  readonly limit = signal(25);
  readonly now = signal(Date.now());
  private generation = 0;
  private alive = true;
  private timer = setInterval(() => this.now.set(Date.now()), 30000);
  readonly label = label;
  readonly state = (row: Period) => validity(row, this.now());
  get uuid() {
    return this.store.uuid;
  }
  get paged() {
    return !fullLists.includes(this.kind);
  }
  filters(): Record<string, string | number> {
    return {};
  }
  ngOnInit() {
    void this.load();
  }
  ngOnDestroy() {
    this.alive = false;
    ++this.generation;
    clearInterval(this.timer);
    this.rows.set([]);
  }
  today() {
    return localDate(this.now(), this.session.context()?.company.timezone ?? 'UTC');
  }
  date(value: string | null | undefined) {
    if (!value) return 'Sin fin';
    return (
      new Intl.DateTimeFormat('es-MX', {
        timeZone: this.session.context()?.company.timezone ?? 'UTC',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value)) +
      ' · ' +
      (this.session.context()?.company.timezone ?? 'UTC')
    );
  }
  async load(offset = this.offset()) {
    const generation = ++this.generation,
      uuid = this.uuid,
      epoch = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.list<T>(uuid, this.kind, offset, this.limit(), this.filters());
      if (
        !this.alive ||
        generation !== this.generation ||
        uuid !== this.uuid ||
        epoch !== this.session.epoch()
      )
        return;
      if (!rows.length && offset > 0) {
        this.success.set('No hay más registros.');
        return;
      }
      this.rows.set(rows);
      this.offset.set(offset);
    } catch (e) {
      if (this.alive && generation === this.generation)
        this.error.set(partnerError(e) || errorMessage(e));
    } finally {
      if (this.alive && generation === this.generation) this.busy.set(false);
    }
  }
  resize(limit: number) {
    this.limit.set(limit);
    return this.load(0);
  }
  async open<C>(component: Type<C>, data: unknown) {
    const result = await firstValueFrom(
      this.dialog.open(component, {
        data,
        width: '760px',
        maxWidth: 'calc(100vw - 32px)',
        disableClose: true,
        ariaLabel: 'Formulario del expediente',
      }).closed,
    );
    if (result && this.alive && this.session.valid()) {
      this.success.set('Registro guardado.');
      await this.load();
      await this.refreshHeader();
    }
  }
  async refreshHeader() {
    try {
      await this.store.load();
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  async review(
    row: Resource & { verification: Verification; evidenceUuid: string | null },
    decision: Verification,
  ) {
    if (!this.session.can('PARTY_APPROVE') || this.busy()) return;
    if (decision === 'VERIFIED' && !row.evidenceUuid) {
      this.error.set('Verificar requiere una evidencia del tercero.');
      return;
    }
    await this.act(row, 'review', { decision }, 'Confirmar revisión: ' + label(decision));
  }
  async revoke(row: Resource) {
    await this.act(row, 'revoke', {}, 'Revocar registro');
  }
  private async act(row: Resource, action: string, extra: object, title: string) {
    const permission = this.kind === 'roles' ? 'PARTY_MANAGE' : 'PARTY_APPROVE';
    if (
      !this.session.can(permission) ||
      this.busy() ||
      !(await confirm(this.dialog, title, 'La acción conservará el registro histórico.'))
    )
      return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.action(this.uuid, this.kind, row.uuid, action, {
        ...extra,
        version: row.version,
      });
      this.success.set('Acción confirmada.');
      await this.load();
      await this.refreshHeader();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
