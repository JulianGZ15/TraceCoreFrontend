import { Component, inject } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
export async function confirm(dialog: Dialog, title: string, message: string) {
  return (
    (await firstValueFrom(
      dialog.open<boolean>(ConfirmDialog, {
        data: { title, message },
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        ariaLabel: title,
      }).closed,
    )) === true
  );
}
@Component({
  selector: 'tc-confirm',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialog {
  readonly data = inject<{ title: string; message: string }>(DIALOG_DATA);
  readonly ref = inject(DialogRef<boolean>);
}
