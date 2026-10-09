import {
  Directive,
  ElementRef,
  OnDestroy,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { NavTooltipComponent } from './nav-tooltip.component';

let nextTooltipId = 0;

@Directive({
  selector: '[tcNavTooltip]',
  host: {
    '(mouseenter)': 'enter()',
    '(mouseleave)': 'leave()',
    '(focus)': 'focus()',
    '(blur)': 'blur()',
    '(keydown.escape)': 'hide()',
    '(click)': 'hide()',
  },
})
export class NavTooltipDirective implements OnDestroy {
  readonly text = input('', { alias: 'tcNavTooltip' });
  readonly tooltipEnabled = input(true);
  private readonly overlay = inject(Overlay);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly view = inject(ViewContainerRef);
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly id = `tc-nav-tooltip-${nextTooltipId++}`;
  private overlayRef?: OverlayRef;
  private hovered = false;
  private focused = false;
  private previousDescription: string | null = null;
  private readonly viewportSubscription: Subscription;

  constructor() {
    effect(() => {
      if (!this.tooltipEnabled()) this.hide();
    });
    this.viewportSubscription = inject(ViewportRuler)
      .change()
      .subscribe(() => this.hide());
  }

  enter() {
    this.hovered = true;
    this.show();
  }
  leave() {
    this.hovered = false;
    if (!this.focused) this.hide();
  }
  focus() {
    this.focused = true;
    this.show();
  }
  blur() {
    this.focused = false;
    if (!this.hovered) this.hide();
  }

  private show() {
    if (!this.tooltipEnabled() || !this.text() || this.overlayRef?.hasAttached()) return;
    this.hide();
    const position = this.overlay
      .position()
      .flexibleConnectedTo(this.element)
      .withScrollableContainers(this.scrollDispatcher.getAncestorScrollContainers(this.element))
      .withPositions([
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 12 },
      ])
      .withViewportMargin(8)
      .withPush(true);
    const ref = this.overlay.create({
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    this.overlayRef = ref;
    position.positionChanges.subscribe(({ scrollableViewProperties }) => {
      if (scrollableViewProperties.isOriginOutsideView) this.hide();
    });
    const tooltip = ref.attach(new ComponentPortal(NavTooltipComponent, this.view));
    tooltip.setInput('text', this.text());
    tooltip.setInput('tooltipId', this.id);
    this.previousDescription = this.element.nativeElement.getAttribute('aria-describedby');
    this.element.nativeElement.setAttribute(
      'aria-describedby',
      [this.previousDescription, this.id].filter(Boolean).join(' '),
    );
    ref.detachments().subscribe(() => this.restoreDescription());
  }

  private restoreDescription() {
    if (this.previousDescription === null)
      this.element.nativeElement.removeAttribute('aria-describedby');
    else this.element.nativeElement.setAttribute('aria-describedby', this.previousDescription);
  }

  hide() {
    if (!this.overlayRef) return;
    this.overlayRef.dispose();
    this.overlayRef = undefined;
    this.restoreDescription();
  }

  ngOnDestroy() {
    this.hide();
    this.viewportSubscription.unsubscribe();
  }
}
