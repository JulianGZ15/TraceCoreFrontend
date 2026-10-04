import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Session } from '../../../core/auth/session';
import { Api, errorMessage } from '../../../core/http/api';
import { PageHeading, Feedback, Status } from '../../../shared/ui/page';
import { newPassword } from '../../../shared/ui/editor';
@Component({
  selector: 'tc-account',
  imports: [ReactiveFormsModule, PageHeading, Feedback, Status],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountPage {
  readonly session = inject(Session);
  private api = inject(Api);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, newPassword]],
    confirmation: ['', Validators.required],
  });
  readonly fields: {
    key: 'currentPassword' | 'newPassword' | 'confirmation';
    label: string;
    help: string;
  }[] = [
    { key: 'currentPassword', label: 'Contraseña actual', help: '' },
    {
      key: 'newPassword',
      label: 'Nueva contraseña',
      help: 'Al menos 12 caracteres y hasta 72 bytes UTF-8.',
    },
    { key: 'confirmation', label: 'Confirmar nueva contraseña', help: '' },
  ];
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    if (this.form.controls.newPassword.value !== this.form.controls.confirmation.value) {
      this.error.set('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const { currentPassword, newPassword } = this.form.getRawValue();
      await this.api.post('/auth/password', { currentPassword, newPassword });
      this.form.reset();
      this.session.logout('Contraseña actualizada. Inicia sesión de nuevo.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
