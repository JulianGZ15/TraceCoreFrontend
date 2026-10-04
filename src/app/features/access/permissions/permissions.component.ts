import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Api, Permission, Role, RolePermission, errorMessage } from '../../../core/http/api';
import { Session } from '../../../core/auth/session';
import { Feedback } from '../../../shared/ui/page';
import { confirm } from '../../../shared/ui/editor';
@Component({
  selector: 'tc-permissions',
  imports: [Feedback],
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss',
})
export class PermissionsPanel {
  readonly role = inject<Role>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  private api = inject(Api);
  private dialog = inject(Dialog);
  private session = inject(Session);
  readonly catalog = signal<Permission[]>([]);
  readonly links = signal<RolePermission[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly selected = signal('');
  constructor() {
    void this.load();
  }
  label(uuid: string) {
    return this.catalog().find((p) => p.uuid === uuid)?.code ?? uuid;
  }
  available() {
    return this.catalog().filter((p) => !this.links().some((l) => l.permissionUuid === p.uuid));
  }
  async load() {
    this.busy.set(true);
    this.error.set('');
    try {
      const [catalog, links] = await Promise.all([
        this.api.all<Permission>('/permissions'),
        this.api.get<RolePermission[]>('/roles/' + this.role.uuid + '/permissions'),
      ]);
      this.catalog.set(catalog);
      this.links.set(links);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async grant() {
    if (!this.selected() || this.busy()) return;
    await this.change(
      () =>
        this.api.post('/roles/' + this.role.uuid + '/permissions', {
          permissionUuid: this.selected(),
        }),
      'Permiso agregado.',
    );
  }
  async remove(link: RolePermission) {
    if (
      !(await confirm(
        this.dialog,
        'Retirar permiso',
        'Se retirará ' + this.label(link.permissionUuid) + ' de este rol.',
      ))
    )
      return;
    await this.change(
      () => this.api.delete('/roles/' + this.role.uuid + '/permissions/' + link.permissionUuid),
      'Permiso retirado.',
    );
  }
  private async change(operation: () => Promise<unknown>, message: string) {
    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await operation();
      this.selected.set('');
      this.links.set(
        await this.api.get<RolePermission[]>('/roles/' + this.role.uuid + '/permissions'),
      );
      await this.session.refresh();
      this.success.set(message);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
