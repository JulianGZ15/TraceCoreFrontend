import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Feedback } from '../feedback/feedback.component';
import { errorMessage } from '../../../core/http/api';
import { EditorData } from '../editor-model';
import { confirm } from '../confirm-dialog/confirm-dialog.component';
export function edit(dialog: Dialog, data: EditorData) {
  return firstValueFrom(
    dialog.open(EditorDialog, {
      data,
      width: '680px',
      maxWidth: 'calc(100vw - 32px)',
      disableClose: true,
      ariaLabel: data.title,
      panelClass: 'editor-overlay',
    }).closed,
  );
}
@Component({
  selector: 'tc-editor',
  host: { '(keydown.escape)': 'escape($event)' },
  imports: [ReactiveFormsModule, Feedback],
  templateUrl: './editor-dialog.component.html',
  styleUrl: './editor-dialog.component.scss',
})
export class EditorDialog {
  readonly data = inject<EditorData>(DIALOG_DATA);
  readonly ref = inject(DialogRef<unknown>);
  readonly dialog = inject(Dialog);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly conflict = signal(false);
  readonly form = new FormGroup<Record<string, FormControl>>({});
  constructor() {
    for (const field of this.data.fields)
      this.form.addControl(
        field.key,
        new FormControl(
          {
            value: this.data.initial?.[field.key] ?? (field.type === 'checkbox' ? true : ''),
            disabled: !!field.disabled,
          },
          [
            ...(field.required ? [Validators.required] : []),
            ...(field.type === 'email' ? [Validators.email] : []),
            ...(field.validators ?? []),
          ],
        ),
      );
  }
  async submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.data.save(this.form.getRawValue());
      this.ref.close(result ?? true);
    } catch (e) {
      this.error.set(errorMessage(e));
      this.conflict.set(e instanceof HttpErrorResponse && e.status === 409);
    } finally {
      this.busy.set(false);
    }
  }
  async reload() {
    if (
      !this.data.reload ||
      !(await confirm(
        this.dialog,
        'Recargar datos',
        'Se descartarán los cambios de este formulario.',
      ))
    )
      return;
    this.busy.set(true);
    try {
      this.form.reset(await this.data.reload());
      this.conflict.set(false);
      this.error.set('');
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
      (await confirm(this.dialog, 'Descartar cambios', 'Los cambios sin guardar se perderán.'))
    )
      this.ref.close();
  }
}
