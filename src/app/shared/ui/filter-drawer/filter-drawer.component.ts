import { Component, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { Icon } from '../icon/icon.component';

export interface FilterDrawerData {
  title?: string;
  subtitle?: string;
  count?: number;
  template: TemplateRef<unknown>;
  context?: unknown;
  applyText?: string;
  onApply?: () => void | Promise<void>;
  onClear?: () => void | Promise<void>;
}

export function openFilterDrawer(dialog: Dialog, data: FilterDrawerData) {
  return firstValueFrom(
    dialog.open(FilterDrawerComponent, {
      data,
      width: '480px',
      maxWidth: '100vw',
      disableClose: false,
      ariaLabel: data.title || 'Filtros',
      panelClass: 'filter-drawer-overlay',
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    }).closed,
  );
}

@Component({
  selector: 'tc-filter-drawer',
  host: { '(keydown.escape)': 'escape($event)' },
  imports: [CommonModule, Icon],
  templateUrl: './filter-drawer.component.html',
  styleUrl: './filter-drawer.component.scss',
})
export class FilterDrawerComponent {
  readonly data = inject<FilterDrawerData>(DIALOG_DATA);
  readonly ref = inject(DialogRef<boolean>);

  async apply(): Promise<void> {
    if (this.data.onApply) {
      await this.data.onApply();
    }
    this.ref.close(true);
  }

  async clear(): Promise<void> {
    if (this.data.onClear) {
      await this.data.onClear();
    }
  }

  escape(event: Event): void {
    event.stopPropagation();
    this.close();
  }

  close(): void {
    this.ref.close(false);
  }
}
