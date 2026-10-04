import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Session, safeReturn } from '../../../core/auth/session';
import { errorMessage } from '../../../core/http/api';
import { BrandLogo } from '../../../shared/ui/brand-logo';
import { Feedback } from '../../../shared/ui/page';
@Component({
  selector: 'tc-login',
  imports: [ReactiveFormsModule, BrandLogo, Feedback],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginPage {
  readonly session = inject(Session);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly show = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  async submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.session.login(this.form.controls.email.value, this.form.controls.password.value);
      this.form.controls.password.reset();
      await this.destination();
    } catch (e) {
      this.error.set(
        e instanceof HttpErrorResponse && e.status === 401
          ? 'No pudimos iniciar sesión con esos datos.'
          : errorMessage(e),
      );
    } finally {
      this.busy.set(false);
    }
  }
  async resume() {
    this.busy.set(true);
    try {
      await this.session.refresh();
      await this.destination();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  private destination() {
    return this.router.navigateByUrl(
      this.session.hasAccess()
        ? safeReturn(this.route.snapshot.queryParamMap.get('returnUrl'))
        : '/sin-acceso',
    );
  }
}
