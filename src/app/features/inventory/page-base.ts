import { Directive, inject, signal, OnDestroy, Type } from '@angular/core';
import { ActivatedRoute, Router, CanDeactivateFn } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { combineLatest, firstValueFrom, Subscription } from 'rxjs';
import { Session } from '../../core/auth/session';
import { errorMessage } from '../../core/http/api';
import { confirm } from '../../shared/ui/editor';
import { InventoryApi } from './inventory-api';
import { InventoryAccess } from './access';
import {
  label,
  prettyDate,
  numberText,
  toInstant,
  scaled,
  decimal,
  exact,
  uuidPattern,
} from '../equipment/rules';
export { toInstant, scaled, decimal, exact, uuidPattern };
const labels: Record<string, string> = {
  YARD: 'En patio',
  EXTERNAL_SITE: 'En sitio externo',
  UNLOCATED: 'Sin ubicación',
  IN_TRANSIT: 'En tránsito',
  DRAFT: 'Borrador',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  INBOUND: 'Ingreso',
  TRANSFER: 'Traslado',
  OUTBOUND: 'Salida externa',
  RETURN: 'Retorno',
  ADJUSTMENT: 'Ajuste',
  HELD: 'Apartado',
  CONFIRMED: 'Confirmado',
  CONSUMED: 'Consumido',
  FULFILLED: 'Cumplido',
  EXPIRED: 'Vencido',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazado',
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  MANUAL: 'Manual',
  RFID: 'RFID',
  SECTOR: 'Sector',
  BAY: 'Bahía',
  RACK: 'Rack',
  SLOT: 'Posición',
  WORKSHOP: 'Taller',
  QUARANTINE: 'Cuarentena',
  BUNKER: 'Búnker',
  STAGING: 'Preparación',
  WELL: 'Pozo',
  RIG: 'Equipo de perforación',
  PLATFORM: 'Plataforma',
  TERMINAL: 'Terminal',
  OTHER: 'Otro',
  STORAGE: 'Almacenamiento',
  CONSIGNMENT: 'Consignación',
  REPAIR: 'Reparación',
  RENTAL: 'Renta',
  TRANSPORT: 'Transporte',
  MATCHED: 'Coincidente',
  MISSING: 'Faltante',
  UNEXPECTED: 'Extra',
  UNKNOWN: 'Desconocido',
  MISPLACED: 'Ubicación distinta',
  ACCEPTED_VARIANCE: 'Variación aceptada',
  CORRECTED: 'Corregida',
  NOT_IN_YARD: 'No está en patio',
  OPEN_MOVEMENT: 'Movimiento abierto',
  ASSEMBLY_COMPONENT: 'Componente de un conjunto',
  RESERVED: 'Reserva solapada',
};
export const inventoryLabel = (v: string) => labels[v] ?? label(v);
@Directive()
export abstract class InventoryPage implements OnDestroy {
  readonly api = inject(InventoryApi);
  readonly access = inject(InventoryAccess);
  readonly session = inject(Session);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly dialog = inject(Dialog);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly conflict = signal(false);
  readonly yard = signal('');
  readonly offset = signal(0);
  readonly limit = signal(25);
  readonly id = signal('');
  readonly label = inventoryLabel;
  readonly numberText = numberText;
  readonly optionalExact = (numeric: unknown, text: unknown, empty = 'Sin dato') =>
    numeric == null && text == null ? empty : numberText(text);
  protected alive = true;
  protected generation = 0;
  private subscription?: Subscription;
  protected watch(load: () => Promise<void>) {
    this.subscription = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(
      ([p, q]) => {
        const nextId = p.get('uuid') ?? '';
        if (this.id() && this.id() !== nextId) this.resourceChanged();
        this.id.set(nextId);
        this.yard.set(
          q.get('yardUuid') ??
            (this.access.global('INVENTORY_READ')
              ? ''
              : (this.session.context()?.yards.find((y) => y.permissions.includes('INVENTORY_READ'))
                  ?.uuid ?? '')),
        );
        this.offset.set(Math.max(0, parseInt(q.get('offset') ?? '0', 10) || 0));
        this.limit.set(
          [10, 25, 50, 100].includes(parseInt(q.get('limit') ?? '25', 10))
            ? parseInt(q.get('limit') ?? '25', 10)
            : 25,
        );
        void load();
      },
    );
  }
  protected resourceChanged() {}
  params(extra: Record<string, string | number | boolean | null | undefined> = {}) {
    return { yardUuid: this.yard(), offset: this.offset(), limit: this.limit(), ...extra };
  }
  query(values: Record<string, string | number | null>) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: values,
      queryParamsHandling: 'merge',
    });
  }
  changeYard(yardUuid: string) {
    this.query({ yardUuid: yardUuid || null, offset: 0, locationUuid: null, parentUuid: null });
  }
  page(offset: number) {
    this.query({ offset });
  }
  date(v: string | null) {
    return prettyDate(v, this.session.context()?.company.timezone ?? 'UTC');
  }
  protected async request<T>(op: () => Promise<T>, apply: (value: T) => void): Promise<boolean> {
    const gen = ++this.generation,
      epoch = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    this.conflict.set(false);
    try {
      const r = await op();
      if (this.alive && gen === this.generation && epoch === this.session.epoch()) {
        apply(r);
        return true;
      }
    } catch (e) {
      if (this.alive && gen === this.generation && epoch === this.session.epoch()) {
        this.error.set(e instanceof Error && !('status' in e) ? e.message : errorMessage(e));
        this.conflict.set(!!e && typeof e === 'object' && 'status' in e && e.status === 409);
        if (
          e &&
          typeof e === 'object' &&
          'status' in e &&
          e.status === 0 &&
          this instanceof InventoryForm &&
          this.frozenRequest()
        )
          this.error.set(
            'Resultado indeterminado. Consulta el recurso antes de repetir manualmente. Si repites sin cambiar los datos, se conserva la misma clave de solicitud.',
          );
      }
    } finally {
      if (this.alive && gen === this.generation) this.busy.set(false);
    }
    return false;
  }
  async editor<C>(component: Type<C>, data: unknown, title: string) {
    return firstValueFrom(
      this.dialog.open(component, {
        data,
        width: '780px',
        maxWidth: 'calc(100vw - 32px)',
        disableClose: true,
        ariaLabel: title,
      }).closed,
    );
  }
  async action(path: string, body: unknown, load: () => Promise<void>, title: string) {
    if (
      this.busy() ||
      !(await confirm(
        this.dialog,
        title,
        'Se aplicará al grupo completo y conservará su historial.',
      ))
    )
      return;
    const ok = await this.request(
      () => this.api.post(path, body),
      () => this.success.set('Acción confirmada.'),
    );
    if (ok) await load();
  }
  ngOnDestroy() {
    this.alive = false;
    ++this.generation;
    this.subscription?.unsubscribe();
  }
}
@Directive()
export abstract class InventoryForm extends InventoryPage {
  abstract readonly form: FormGroup;
  private readonly ended = this.session.ended.subscribe(() => {
    this.form?.reset();
    this.frozen = null;
  });
  protected frozen: { path: string; body: unknown } | null = null;
  frozenRequest() {
    return this.frozen !== null;
  }
  async canLeave() {
    const leave =
      !this.session.valid() ||
      !this.form.dirty ||
      (await confirm(this.dialog, 'Descartar cambios', 'Se perderán los cambios sin guardar.'));
    if (leave && this.form.dirty) {
      this.form.reset();
      this.form.markAsPristine();
      this.frozen = null;
    }
    return leave;
  }
  protected override resourceChanged() {
    this.form.reset();
    this.form.markAsPristine();
    this.frozen = null;
  }
  async submitKeyed<T>(path: string, body: Record<string, unknown>, apply: (v: T) => void) {
    if (this.busy()) return;
    const normalized = (v: unknown) => {
      const c = structuredClone(v) as Record<string, unknown>;
      delete c['requestKey'];
      if (c['movement']) delete (c['movement'] as Record<string, unknown>)['requestKey'];
      return JSON.stringify(c);
    };
    if (
      !this.frozen ||
      this.frozen.path !== path ||
      normalized(this.frozen.body) !== normalized(body)
    ) {
      const key = crypto.randomUUID();
      this.frozen = {
        path,
        body:
          path === '/proposals'
            ? { ...body, movement: { ...(body['movement'] as object), requestKey: key } }
            : { ...body, requestKey: key },
      };
    }
    const ok = await this.request(() => this.api.post<T>(path, this.frozen!.body), apply);
    if (ok) {
      this.form.markAsPristine();
      this.frozen = null;
    }
  }
  override ngOnDestroy() {
    super.ngOnDestroy();
    this.ended.unsubscribe();
    this.form.reset();
    this.frozen = null;
  }
}
export const inventoryDraftGuard: CanDeactivateFn<InventoryForm> = (component) =>
  component.canLeave();
