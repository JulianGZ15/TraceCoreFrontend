import { Component, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Api, Role } from '../../../core/http/api';
import { PageHeading, Feedback, Pagination } from '../../../shared/ui/page';
import { PageList } from '../../../shared/ui/list-model';
import { edit, codeValidator } from '../../../shared/ui/editor';
import { PermissionsPanel } from '../permissions';
@Component({
  selector: 'tc-roles',
  imports: [PageHeading, Feedback, Pagination],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesPage {
  private api = inject(Api);
  private dialog = inject(Dialog);
  readonly list = new PageList<Role>(this.api, '/roles');
  constructor() {
    void this.list.load();
  }
  async create() {
    const result = await edit(this.dialog, {
      title: 'Nuevo rol',
      fields: [
        {
          key: 'code',
          label: 'Código',
          required: true,
          validators: [codeValidator],
          help: 'Comienza con una letra; máximo 80 caracteres.',
        },
        { key: 'name', label: 'Nombre', required: true },
      ],
      save: (v) => this.api.post<Role>('/roles', v),
    });
    if (result) {
      this.list.success.set('Rol creado. Agrega sus permisos.');
      await this.list.load();
    }
  }
  permissions(role: Role) {
    this.dialog.open(PermissionsPanel, {
      data: role,
      panelClass: 'drawer-overlay',
      ariaLabel: 'Permisos de ' + role.name,
    });
  }
}
