import { Type } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
export function openPartnerEditor<T>(dialog: Dialog, component: Type<T>, data: unknown) {
  return firstValueFrom(
    dialog.open(component, {
      data,
      width: '760px',
      maxWidth: 'calc(100vw - 32px)',
      disableClose: true,
      ariaLabel: 'Formulario del expediente',
    }).closed,
  );
}
