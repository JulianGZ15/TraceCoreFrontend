import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Session } from '../../auth/session';
import { Icon } from '../../../shared/ui/icon';
import { Feedback, ProgressBar, Spinner } from '../../../shared/ui/page';
import { errorMessage } from '../../http/api';
import { Navigation } from '../navigation/navigation.component';
@Component({
  selector: 'tc-shell',
  imports: [RouterOutlet, RouterLink, Navigation, Feedback, Icon, ProgressBar, Spinner],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  host: { '[class.sidebar-collapsed]': 'collapsed()' },
})
export class Shell {
  private readonly sidebarStorageKey = 'tracecore.sidebar.collapsed';
  readonly collapsed = signal(this.readSidebarPreference());
  readonly session = inject(Session);
  private dialog = inject(Dialog);
  private router = inject(Router);
  readonly error = signal('');
  readonly changing = signal(false);
  readonly navigating = signal(false);
  private readSidebarPreference(): boolean {
    try {
      return localStorage.getItem(this.sidebarStorageKey) !== 'false';
    } catch {
      return true;
    }
  }
  toggleSidebar() {
    this.collapsed.update((value) => !value);
    try {
      localStorage.setItem(this.sidebarStorageKey, String(this.collapsed()));
    } catch {
      // The in-memory preference remains usable when browser storage is unavailable.
    }
  }
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.navigating.set(true);
      } else if (
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      ) {
        this.navigating.set(false);
        if (e instanceof NavigationEnd) {
          setTimeout(() => {
            document.querySelector<HTMLElement>('h1')?.focus();
          }, 0);
        }
      }
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
