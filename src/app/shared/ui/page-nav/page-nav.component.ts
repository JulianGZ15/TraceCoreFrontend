import {
  Component,
  input,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface PageNavItem {
  label: string;
  route: string | any[];
  queryParams?: Record<string, any>;
  queryParamsHandling?: '' | 'merge' | 'preserve';
  exact?: boolean;
  visible?: boolean;
  badge?: string | number;
  ariaLabel?: string;
}

@Component({
  selector: 'tc-page-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './page-nav.component.html',
  styleUrl: './page-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNav implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router, { optional: true });
  private sub?: Subscription;

  readonly items = input.required<PageNavItem[]>();
  readonly ariaLabel = input<string>('Navegación de secciones');
  readonly navContainer = viewChild<ElementRef<HTMLElement>>('navContainer');

  ngAfterViewInit(): void {
    this.scrollToActiveTab();
    if (this.router) {
      this.sub = this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          setTimeout(() => this.scrollToActiveTab(), 0);
        });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  trackItem(index: number, item: PageNavItem): string {
    const routeStr = Array.isArray(item.route) ? item.route.join('/') : item.route;
    return `${item.label}:${routeStr}`;
  }

  scrollToActiveTab(): void {
    const el = this.navContainer()?.nativeElement;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('.active');
    if (!active) return;

    const containerRect = el.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    if (activeRect.left < containerRect.left) {
      el.scrollLeft += activeRect.left - containerRect.left - 12;
    } else if (activeRect.right > containerRect.right) {
      el.scrollLeft += activeRect.right - containerRect.right + 12;
    }
  }
}
