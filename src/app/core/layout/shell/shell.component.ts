import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Session } from '../../auth/session';
import { BrandLogo } from '../../../shared/ui/brand-logo';
import { Icon } from '../../../shared/ui/icon';
import { Feedback } from '../../../shared/ui/page';
import { errorMessage } from '../../http/api';
import { Navigation } from '../navigation/navigation.component';
@Component({
  selector: 'tc-shell',
  imports: [RouterOutlet, RouterLink, Navigation, Feedback, Icon],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class Shell {
  readonly session = inject(Session);
  private dialog = inject(Dialog);
  private router = inject(Router);
  readonly error = signal('');
  readonly changing = signal(false);
  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        setTimeout(() => {
          document.querySelector<HTMLElement>('h1')?.focus();
        }, 0);
      });
  }
  initials() {
    return (this.session.user()?.name ?? 'TC')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase();
  }
  menu() {
    this.dialog.open(Navigation, { panelClass: 'nav-overlay', ariaLabel: 'Navegación principal' });
  }
  async select(uuid: string) {
    this.changing.set(true);
    this.error.set('');
    try {
      await this.session.selectYard(uuid);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.changing.set(false);
    }
  }
}
