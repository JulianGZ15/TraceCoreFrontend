import { Component, inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { Api, User } from '../../../core/http/api';
import { Session } from '../../../core/auth/session';
import { PageHeading, Feedback, Status, Pagination } from '../../../shared/ui/page';
import { PageList } from '../../../shared/ui/list-model';
import { Field, edit, newPassword } from '../../../shared/ui/editor';
import { AssignmentsPanel } from '../assignments';
@Component({
  selector: 'tc-users',
  imports: [PageHeading, Feedback, Status, Pagination],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersPage {
  private api = inject(Api);
  private dialog = inject(Dialog);
  readonly session = inject(Session);
  readonly list = new PageList<User>(this.api, '/users');
  private fields: Field[] = [
    { key: 'name', label: 'Nombre completo', required: true },
    {
      key: 'email',
      label: 'Correo electrónico',
      type: 'email',
      required: true,
      validators: [Validators.maxLength(254)],
    },
  ];
  constructor() {
    void this.list.load();
  }
  async create() {
    const result = await edit(this.dialog, {
      title: 'Nuevo usuario',
      description: 'La cuenta se crea sin roles. Asigna su acceso después del alta.',
      fields: [
        ...this.fields,
        {
          key: 'password',
          label: 'Contraseña inicial',
          type: 'password',
          required: true,
          validators: [newPassword],
          help: 'Al menos 12 caracteres y hasta 72 bytes UTF-8.',
        },
      ],
      save: (v) => this.api.post<User>('/users', v),
    });
    if (result) {
      this.list.success.set(
        'El usuario fue creado sin roles. Abre Asignaciones para otorgarle acceso.',
      );
      await this.list.load();
    }
  }
  async update(user: User) {
    let version = user.version;
    const result = await edit(this.dialog, {
      title: 'Editar usuario',
      fields: [
        ...this.fields,
        {
          key: 'active',
          label: 'Cuenta activa',
          type: 'checkbox',
          disabled: user.uuid === this.session.user()?.uuid,
        },
      ],
      initial: { ...user },
      save: (v) => this.api.put<User>('/users/' + user.uuid, { ...v, version }),
      reload: async () => {
        const current = (await this.api.all<User>('/users')).find((u) => u.uuid === user.uuid);
        if (!current) throw new Error('User missing');
        version = current.version;
        return { ...current };
      },
    });
    if (result) {
      this.list.success.set('Cuenta actualizada.');
      await this.list.load();
      await this.session.refresh();
    }
  }
  assignments(user: User) {
    this.dialog.open(AssignmentsPanel, {
      data: user,
      disableClose: true,
      panelClass: 'drawer-overlay',
      ariaLabel: 'Asignaciones de ' + user.name,
    });
  }
}
