import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { confirm } from './confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class UnsavedChanges {
  private readonly dialog = inject(Dialog);
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  constructor() {
    this.window?.addEventListener('beforeunload', this.beforeUnload);
  }

  async confirmDiscard(
    dirty: boolean,
    message = 'Los cambios sin guardar se perderán.',
  ): Promise<boolean> {
    if (!dirty) return true;
    return confirm(this.dialog, 'Descartar cambios', message);
  }

  private readonly beforeUnload = (event: BeforeUnloadEvent) => {
    if (!this.document.querySelector('.ng-dirty')) return;
    event.preventDefault();
    event.returnValue = '';
  };
}
