import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Session } from '../../../core/auth/session';
import { PageHeading, Status } from '../../../shared/ui/page';
import { Icon } from '../../../shared/ui/icon';
@Component({
  selector: 'tc-home',
  imports: [RouterLink, PageHeading, Status, Icon],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomePage {
  readonly session = inject(Session);
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
