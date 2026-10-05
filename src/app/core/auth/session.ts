import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Api, Context, Login, User } from '../http/api';

export function safeReturn(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\\\x00-\x20]/.test(value))
    return '/inicio';
  const path = value.split(/[?#]/)[0];
  if (/^\/inventario\/(?:patios|equipos|movimientos|reservas|propuestas|conteos|sitios|ubicaciones)(?:\/(?:nuevo|nueva|[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12})(?:\/(?:actual|ubicacion|custodia|disponibilidad|recepcion))?)?$/.test(path)) return value;
  const id = '[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}';
  if (new RegExp('^/catalogo(?:/(?:categorias|grados|coladas|lotes(?:/'+id+')?|modelos(?:/'+id+'(?:/fichas/nueva)?)?|fichas/'+id+'))?$').test(path) || new RegExp('^/equipos(?:/nuevo|/'+id+'(?:/(?:general|tecnica|materiales|propiedad|condicion|lotes|composicion|uso))?)?$').test(path)) return value;
  if (
    /^\/terceros(?:\/[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}(?:\/(?:general|roles|contactos|domicilios|fiscal|certificaciones|evidencias|condiciones|autorizaciones|avl|cuotas))?)?$/.test(
      path,
    )
  )
    return value;
  return /^\/(inicio|mi-cuenta|auditoria|acceso\/(usuarios|roles)|organizacion\/(empresa|patios(?:\/[a-fA-F0-9-]{36})?))$/.test(
    path,
  )
    ? value
    : '/inicio';
}
export function isApiUrl(url: string, base: string, origin: string): boolean {
  const request = new URL(url, origin),
    target = new URL(base, origin);
  return (
    request.origin === target.origin &&
    (request.pathname === target.pathname ||
      request.pathname.startsWith(target.pathname.replace(/\/$/, '') + '/'))
  );
}

@Injectable({ providedIn: 'root' })
export class Session implements OnDestroy {
  private api = inject(Api);
  private router = inject(Router);
  private dialog = inject(Dialog);
  private key = 'tracecore.session';
  readonly user = signal<User | null>(null);
  readonly context = signal<Context | null>(null);
  readonly selectedYard = signal(sessionStorage.getItem('tracecore.yard') ?? '');
  readonly notice = signal('');
  readonly ended = new Subject<void>();
  readonly token = signal<string | null>(null);
  readonly epoch = signal(0);
  private expires = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private refreshing?: Promise<void>;
  private readonly visibility = () => {
    if (document.visibilityState === 'visible') this.checkExpiry();
  };
  private readonly focus = () => this.checkExpiry();
  readonly inventoryRead = computed(()=>this.can('INVENTORY_READ')||!!this.context()?.yards.some(y=>y.permissions.includes('INVENTORY_READ')));
  readonly inventoryWrite = computed(()=>{const codes=['INVENTORY_MANAGE','MOVEMENT_MANAGE','DISPATCH_APPROVE','INVENTORY_ADJUST','RESERVATION_MANAGE','CUSTODY_MANAGE','INVENTORY_OBSERVE'];return codes.some(p=>this.can(p)||!!this.context()?.yards.some(y=>y.permissions.includes(p)));});
  readonly hasAccess = computed(() => {
    const c = this.context();
    return (
      !!c &&
      (c.companyPermissions.some((p) =>
        [
          'ORGANIZATION_MANAGE',
          'ORGANIZATION_READ',
          'YARD_MANAGE',
          'ACCESS_MANAGE',
          'AUDIT_READ',
          'PARTY_READ',
          'PARTY_MANAGE',
          'PARTY_APPROVE',
          'AVL_MANAGE',
          'INVENTORY_READ','INVENTORY_MANAGE','MOVEMENT_MANAGE','DISPATCH_APPROVE','INVENTORY_ADJUST','RESERVATION_MANAGE','CUSTODY_MANAGE','INVENTORY_OBSERVE',
          'EQUIPMENT_READ',
          'EQUIPMENT_MANAGE',
          'TECHNICAL_APPROVE',
          'OWNERSHIP_MANAGE',
        ].includes(p),
      ) ||
        c.yards.length > 0)
    );
  });
  constructor() {
    try {
      const value = JSON.parse(sessionStorage.getItem(this.key) ?? 'null');
      if (
        value &&
        typeof value.token === 'string' &&
        Number.isFinite(Date.parse(value.expiresAt)) &&
        Date.parse(value.expiresAt) > Date.now()
      ) {
        this.token.set(value.token);
        this.expires = Date.parse(value.expiresAt);
        this.schedule();
      } else this.clear();
    } catch {
      this.clear();
    }
    document.addEventListener('visibilitychange', this.visibility);
    window.addEventListener('focus', this.focus);
  }
  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
    document.removeEventListener('visibilitychange', this.visibility);
    window.removeEventListener('focus', this.focus);
    this.ended.complete();
  }
  valid() {
    return !!this.token() && this.expires > Date.now();
  }
  can(permission: string, yard?: string) {
    const c = this.context();
    return (
      !!c &&
      (yard
        ? c.yards.find((y) => y.uuid === yard)?.permissions.includes(permission) === true
        : c.companyPermissions.includes(permission))
    );
  }
  async login(email: string, password: string) {
    const result = await this.api.post<Login>('/auth/login', { email, password });
    this.clear();
    this.token.set(result.accessToken);
    this.expires = Date.parse(result.expiresAt);
    sessionStorage.setItem(
      this.key,
      JSON.stringify({ token: result.accessToken, expiresAt: result.expiresAt }),
    );
    this.notice.set('');
    this.schedule();
    await this.refresh();
  }
  refresh(): Promise<void> {
    if (this.refreshing) return this.refreshing;
    if (!this.valid()) return Promise.reject(new Error('Session expired'));
    const epoch = this.epoch();
    const request = Promise.all([
      this.api.get<User>('/auth/me'),
      this.api.get<Context>('/auth/context'),
    ]).then(([user, context]) => {
      if (this.epoch() !== epoch || !this.valid()) throw new Error('Session changed');
      this.user.set(user);
      this.context.set(context);
      if (!context.yards.some((y) => y.uuid === this.selectedYard())) this.setYard('');
    });
    this.refreshing = request;
    void request
      .finally(() => {
        if (this.refreshing === request) this.refreshing = undefined;
      })
      .catch(() => {});
    return request;
  }
  async selectYard(uuid: string) {
    await this.refresh();
    if (!uuid || this.context()?.yards.some((y) => y.uuid === uuid)) this.setYard(uuid);
  }
  private setYard(uuid: string) {
    this.selectedYard.set(uuid);
    if (uuid) sessionStorage.setItem('tracecore.yard', uuid);
    else sessionStorage.removeItem('tracecore.yard');
  }
  invalidateContext() {
    this.context.set(null);
    return this.refresh();
  }
  logout(message = 'Cerraste tu sesiÃƒÂ³n.', preserveReturn = false) {
    const destination = safeReturn(this.router.url);
    this.dialog.closeAll();
    this.clear();
    this.notice.set(message);
    void this.router.navigate(['/login'], {
      queryParams: preserveReturn ? { returnUrl: destination } : {},
    });
  }
  private clear() {
    this.epoch.update((n) => n + 1);
    this.ended.next();
    this.token.set(null);
    this.user.set(null);
    this.context.set(null);
    this.expires = 0;
    this.refreshing = undefined;
    this.setYard('');
    sessionStorage.removeItem(this.key);
    if (this.timer) clearTimeout(this.timer);
  }
  private schedule() {
    this.timer = setTimeout(
      () => this.checkExpiry(),
      Math.min(Math.max(this.expires - Date.now(), 1), 2147483647),
    );
  }
  checkExpiry() {
    if (this.token() && !this.valid())
      this.logout('Tu sesiÃƒÂ³n finalizÃƒÂ³. Inicia sesiÃƒÂ³n de nuevo.', true);
  }
}
