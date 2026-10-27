import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import { DatePipe, KeyValuePipe } from '@angular/common';

import { RouterLink } from '@angular/router';

import { Session } from '../../../core/auth/session';

import { Api, readErrorMessage } from '../../../core/http/api';

import { HomeDashboard } from '../../queries/models';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PageHeading, Status } from '../../../shared/ui/page';

import { Icon } from '../../../shared/ui/icon';

@Component({

  selector: 'tc-home',

  imports: [RouterLink, PageHeading, Status, Icon, DatePipe, KeyValuePipe],

  templateUrl: './home.component.html',

  styleUrl: './home.component.scss',

})

export class HomePage implements OnInit {

  readonly session = inject(Session);

  private readonly destroyRef = inject(DestroyRef);

  private readonly api = inject(Api);

  readonly dashboard = signal<HomeDashboard | null>(null);

  readonly dashboardLoading = signal(false);

  readonly dashboardError = signal('');

  readonly dashboardForbidden = signal(false);

  readonly selectedScope = signal('');

  private requestVersion = 0;

  readonly scopeOptions = computed(() => {
    const context = this.session.context();
    if (!context) return [];
    const scopes: { id: string; label: string; yardUuid?: string }[] = [];
    if (context.companyPermissions.includes('QUERY_READ')) {
      scopes.push({ id: 'company', label: `Empresa · ${context.company.name}` });
    }
    for (const yard of context.yards) {
      if (yard.active && (context.companyPermissions.includes('QUERY_READ') || yard.permissions.includes('QUERY_READ'))) {
        scopes.push({ id: yard.uuid, label: `${yard.code} · ${yard.name}`, yardUuid: yard.uuid });
      }
    }
    return scopes;
  });

  readonly hasQueryScope = computed(() => this.scopeOptions().length > 0);

  ngOnInit() {
    const scopes = this.scopeOptions();
    if (!scopes.length) return;
    const selectedYard = this.session.selectedYard();
    const initial = scopes.find((scope) => scope.yardUuid === selectedYard) ?? scopes[0];
    this.selectedScope.set(initial.id);
    void this.loadDashboard();
    this.session.ended.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      ++this.requestVersion;
      this.dashboard.set(null);
      this.dashboardLoading.set(false);
      this.dashboardForbidden.set(false);
    });
  }

  async changeScope(value: string) {
    if (!this.scopeOptions().some((scope) => scope.id === value)) return;
    this.selectedScope.set(value);
    await this.loadDashboard();
  }

  async loadDashboard() {
    const scope = this.scopeOptions().find((option) => option.id === this.selectedScope());
    if (!scope) {
      this.dashboard.set(null);
      return;
    }
    const version = ++this.requestVersion;
    this.dashboard.set(null);
    this.dashboardError.set('');
    this.dashboardForbidden.set(false);
    this.dashboardLoading.set(true);
    try {
      const result = await this.api.get<HomeDashboard>('/queries/home', scope.yardUuid ? { yardUuid: scope.yardUuid } : {});
      if (version === this.requestVersion) this.dashboard.set(result);
    } catch (error) {
      if (version === this.requestVersion) {
        if (error instanceof HttpErrorResponse && error.status === 403) this.dashboardForbidden.set(true);
        else this.dashboardError.set(readErrorMessage(error));
      }
    } finally {
      if (version === this.requestVersion) this.dashboardLoading.set(false);
    }
  }

  hasAuthorizedSection(section: { authorized: boolean; data: unknown } | null | undefined) {
    return section?.authorized === true && section.data !== null;
  }

  hasAnyMetrics(data: HomeDashboard) {
    return [data.inventory, data.commercial, data.logistics, data.quality, data.partners,
      data.finance, data.documents, data.rfid, data.organization, data.access]
      .some((section) => this.hasAuthorizedSection(section));
  }

  stateLabel(state: string) {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador', PENDING: 'Pendiente', APPROVED: 'Aprobada', IN_PROGRESS: 'En curso',
      COMPLETED: 'Completada', CANCELLED: 'Cancelada', DISPATCHED: 'Despachada',
      DELIVERED: 'Entregada', OPEN: 'Abierta', CLOSED: 'Cerrada', RECEIVED: 'Recibido',
      LINKED: 'Conciliado', UNLINKED: 'Sin conciliar',
    };
    return labels[state] ?? state.replaceAll('_', ' ').toLowerCase();
  }

  formatCount(value: number) {
    return new Intl.NumberFormat('es-MX').format(value);
  }

  formatWeight(value: string | number | undefined) {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 }).format(Number(value));
  }

  formatMoney(value: string, currency: string) {
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
    if (!match) return `${currency} ${value}`;
    const [, sign, whole, fraction = ''] = match;
    const grouped = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(BigInt(whole));
    const decimal = new Intl.NumberFormat('es-MX').formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
    return `${currency} ${sign}${grouped}${fraction ? decimal + fraction : ''}`;
  }

  firstName() {

    return this.session.user()?.name.split(' ')[0] ?? '';

  }

  readonly cards = [

    {path:'/catalogo/categorias',permission:'EQUIPMENT_READ',icon:'domain',title:'Catálogo técnico',description:'Categorías, modelos, fichas y trazabilidad de materiales.'},

    {path:'/equipos',permission:'EQUIPMENT_READ',icon:'warehouse',title:'Equipos',description:'Piezas, propiedad, condición, conjuntos y horas de uso.'},

    {

      path: '/terceros',

      permission: 'PARTY_READ',

      icon: 'group',

      title: 'Terceros y AVL',

      description: 'Expedientes, documentación y habilitación comercial por alcance.',

    },

    {

      path: '/organizacion/empresa',

      permission: 'ORGANIZATION_READ',

      icon: 'domain',

      title: 'Empresa',

      description: 'Consulta y administra la información de tu organización.',

    },

    {

      path: '/organizacion/patios',

      permission: 'YARD_MANAGE',

      icon: 'warehouse',

      title: 'Patios',

      description: 'Organiza sedes, direcciones y zonas horarias.',

    },

    {

      path: '/acceso/usuarios',

      permission: 'ACCESS_MANAGE',

      icon: 'group',

      title: 'Usuarios',

      description: 'Gestiona cuentas y asignaciones por alcance.',

    },

    {

      path: '/acceso/roles',

      permission: 'ACCESS_MANAGE',

      icon: 'shield',

      title: 'Roles y permisos',

      description: 'Define las capacidades de cada rol.',

    },

    {

      path: '/auditoria',

      permission: 'AUDIT_READ',

      icon: 'history',

      title: 'Auditoría',

      description: 'Consulta las acciones registradas y su trazabilidad.',

    },

  ];

}
