import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Api, Assignment, Role, User, errorMessage } from '../../../core/http/api';
import { Session } from '../../../core/auth/session';
import { Feedback } from '../../../shared/ui/page';
import { confirm } from '../../../shared/ui/editor';
import { assignmentState, toInstant } from '../assignment-time';
@Component({
  selector: 'tc-assignments',
  host: { '(keydown.escape)': 'escape($event)' },
  imports: [ReactiveFormsModule, Feedback],
  templateUrl: './assignments.component.html',
  styleUrl: './assignments.component.scss',
})
export class AssignmentsPanel implements OnDestroy {
  readonly user = inject<User>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  readonly session = inject(Session);
  private api = inject(Api);
  private dialog = inject(Dialog);
  readonly roles = signal<Role[]>([]);
  readonly assignments = signal<Assignment[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly now = signal(Date.now());
  private timer = setInterval(() => this.now.set(Date.now()), 30000);
  readonly form = inject(FormBuilder).nonNullable.group({
    roleUuid: ['', Validators.required],
    scopeType: ['COMPANY'],
    yardUuid: [''],
    validFrom: [''],
    validTo: [''],
    offset: ['+00:00', Validators.required],
  });
  constructor() {
    void this.load();
  }
  ngOnDestroy() {
    clearInterval(this.timer);
    this.form.reset();
  }
  roleName(uuid: string) {
    return this.roles().find((r) => r.uuid === uuid)?.name ?? uuid;
  }
  yardName(uuid: string | null) {
    return this.session.context()?.yards.find((y) => y.uuid === uuid)?.name ?? uuid ?? 'Patio';
  }
  date(value: string) {
    return (
      new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: this.session.context()?.company.timezone ?? 'UTC',
      }).format(new Date(value)) +
      ' · ' +
      (this.session.context()?.company.timezone ?? 'UTC')
    );
  }
  state(a: Assignment) {
    return assignmentState(a, this.now());
  }
  async load() {
    this.busy.set(true);
    this.error.set('');
    try {
      const [roles, assignments] = await Promise.all([
        this.api.all<Role>('/roles'),
        this.api.get<Assignment[]>('/users/' + this.user.uuid + '/assignments'),
      ]);
      this.roles.set(roles);
      this.assignments.set(assignments);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async assign() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.error.set('');
    const v = this.form.getRawValue();
    try {
      if (
        v.scopeType === 'YARD' &&
        !/^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/.test(v.yardUuid)
      )
        throw new Error('Indica un UUID de patio válido.');
      const from = toInstant(v.validFrom, v.offset),
        to = toInstant(v.validTo, v.offset);
      if (to && Date.parse(to) <= (from ? Date.parse(from) : Date.now()))
        throw new Error('El fin debe ser posterior al inicio.');
      this.busy.set(true);
      await this.api.post('/users/' + this.user.uuid + '/assignments', {
        roleUuid: v.roleUuid,
        scopeType: v.scopeType,
        companyUuid: this.session.context()?.company.uuid,
        yardUuid: v.scopeType === 'YARD' ? v.yardUuid : null,
        ...(from ? { validFrom: from } : {}),
        ...(to ? { validTo: to } : {}),
      });
      this.form.reset({
        roleUuid: '',
        scopeType: 'COMPANY',
        yardUuid: '',
        validFrom: '',
        validTo: '',
        offset: '+00:00',
      });
      await this.load();
      await this.session.refresh();
      this.success.set('Rol asignado.');
    } catch (e) {
      this.error.set(
        e instanceof Error && !(e as { status?: number }).status ? e.message : errorMessage(e),
      );
    } finally {
      this.busy.set(false);
    }
  }
  async revoke(a: Assignment) {
    if (
      this.busy() ||
      a.userUuid === this.session.user()?.uuid ||
      !(await confirm(
        this.dialog,
        'Revocar asignación',
        'Se retirará ' +
          this.roleName(a.roleUuid) +
          ' de ' +
          this.user.name +
          '. El historial se conservará.',
      ))
    )
      return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post('/assignments/' + a.uuid + '/revoke', { version: a.version });
      await this.load();
      await this.session.refresh();
      this.success.set('Asignación revocada.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  escape(event: Event) {
    event.stopPropagation();
    void this.close();
  }
  async close() {
    if (this.busy()) return;
    if (
      !this.form.dirty ||
      (await confirm(this.dialog, 'Descartar cambios', 'Se perderá la asignación sin guardar.'))
    )
      this.ref.close();
  }
}
