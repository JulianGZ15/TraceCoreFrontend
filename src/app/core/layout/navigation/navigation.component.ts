import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DialogRef } from '@angular/cdk/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Session } from '../../auth/session';
import { BrandLogo } from '../../../shared/ui/brand-logo';
import { Icon } from '../../../shared/ui/icon';
import { NavTooltipDirective } from '../../../shared/ui/nav-tooltip/nav-tooltip.directive';
@Component({
  selector: 'tc-navigation',
  imports: [RouterLink, RouterLinkActive, BrandLogo, Icon, NavTooltipDirective, CdkScrollable],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class Navigation {
  readonly collapsed = input(false);
  readonly toggleCollapsed = output<void>();
  readonly session = inject(Session);
  readonly ref = inject(DialogRef, { optional: true });
  close() {
    this.ref?.close();
  }
}
