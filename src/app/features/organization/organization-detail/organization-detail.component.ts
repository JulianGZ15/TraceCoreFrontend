import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { Api, Company, Yard, errorMessage } from '../../../core/http/api';
import { Session } from '../../../core/auth/session';
import { PageHeading, Feedback, Status } from '../../../shared/ui/page';
import { Field, codeValidator, confirm } from '../../../shared/ui/editor';
export const yardFields: Field[] = [
  {
    key: 'code',
    label: 'Código',
    required: true,
    validators: [codeValidator],
    help: 'Letras, números, guion, dos puntos o guion bajo.',
  },
  { key: 'name', label: 'Nombre', required: true },
  { key: 'address', label: 'Dirección', required: true },
  {
    key: 'timezone',
    label: 'Zona horaria IANA',
    required: true,
    help: 'Ejemplo: America/Mexico_City',
  },
];
@Component({
  selector: 'tc-organization-detail',
  imports: [ReactiveFormsModule, RouterLink, PageHeading, Feedback, Status],
  templateUrl: './organization-detail.component.html',
  styleUrl: './organization-detail.component.scss',
})
export class OrganizationDetail {
  readonly session = inject(Session);
  private api = inject(Api);
  private dialog = inject(Dialog);
  private route = inject(ActivatedRoute);
  readonly isYard = !!this.route.snapshot.paramMap.get('uuid');
  private generation = 0;
  private path = this.isYard ? '/yards/' + this.route.snapshot.paramMap.get('uuid') : '/company';
  readonly fields: Field[] = this.isYard
    ? yardFields
    : [
        {
          key: 'legalName',
          label: 'Razón social',
          required: true,
          validators: [Validators.maxLength(250)],
        },
        {
          key: 'name',
          label: 'Nombre de la empresa',
          required: true,
          validators: [Validators.maxLength(150)],
        },
        {
          key: 'country',
          label: 'País (ISO alpha-2)',
          required: true,
          validators: [Validators.pattern(/^[A-Za-z]{2}$/)],
          help: 'Ejemplo: MX',
        },
        {
          key: 'timezone',
          label: 'Zona horaria IANA',
          required: true,
          help: 'Ejemplo: America/Mexico_City',
        },
      ];
  readonly form = new FormGroup<Record<string, FormControl>>({ active: new FormControl(true) });
  readonly loaded = signal<Company | Yard | null>(null);
  readonly busy = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly conflict = signal(false);
  constructor() {
    for (const field of this.fields)
      this.form.addControl(
        field.key,
        new FormControl('', [Validators.required, ...(field.validators ?? [])]),
      );
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.path = this.isYard ? '/yards/' + params.get('uuid') : '/company';
      this.loaded.set(null);
      this.success.set('');
      void this.load();
    });
  }
  canEdit() {
    return this.session.can(this.isYard ? 'YARD_MANAGE' : 'ORGANIZATION_MANAGE');
  }
  async load() {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const data = await this.api.get<Company | Yard>(this.path);
      if (generation !== this.generation) return;
      this.loaded.set(data);
      this.form.enable();
      this.form.reset({ ...data });
      if (!this.canEdit()) this.form.disable();
      this.conflict.set(false);
    } catch (e) {
      if (generation === this.generation) this.error.set(errorMessage(e));
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }
  async reload() {
    if (
      !this.form.dirty ||
      (await confirm(
        this.dialog,
        'Recargar información',
        'Se descartarán los cambios sin guardar.',
      ))
    )
      await this.load();
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving() || !this.canEdit()) return;
    const generation = this.generation;
    const path = this.path;
    const version = this.loaded()?.version;
    const value = this.form.getRawValue();
    if (
      value['active'] === false &&
      this.loaded()?.active &&
      !(await confirm(
        this.dialog,
        'Desactivar ' + (this.isYard ? 'patio' : 'empresa'),
        this.isYard
          ? 'La lectura operativa de este patio quedará suspendida.'
          : 'Los permisos operativos quedarán suspendidos hasta reactivar la empresa.',
      ))
    )
      return;
    if (generation !== this.generation) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const result = await this.api.put<Company | Yard>(path, {
        ...value,
        version,
      });
      if (generation !== this.generation) return;
      this.loaded.set(result);
      this.form.reset({ ...result });
      this.conflict.set(false);
      this.success.set('Información actualizada.');
      await this.session.refresh();
    } catch (e) {
      if (generation === this.generation) {
        this.error.set(errorMessage(e));
        this.conflict.set(e instanceof HttpErrorResponse && e.status === 409);
      }
    } finally {
      this.saving.set(false);
    }
  }
}
