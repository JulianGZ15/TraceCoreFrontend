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
@Component({
  selector: 'tc-navigation',
  imports: [RouterLink, RouterLinkActive, BrandLogo, Icon],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class Navigation {
  readonly session = inject(Session);
  readonly ref = inject(DialogRef, { optional: true });
  close() {
    this.ref?.close();
  }
}
