import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  inject,
  input,
} from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { helpEntry } from './help-catalog';
import { NavTooltipComponent } from '../nav-tooltip/nav-tooltip.component';

let nextHelpTipId = 0;

@Component({
  selector: 'tc-help-tip',
  templateUrl: './help-tip.component.html',
  styleUrl: './help-tip.component.scss',
})
export class HelpTipComponent implements OnDestroy {
  readonly term = input.required<string>();
  readonly label = input('');
  readonly entry = () => helpEntry(this.term());
  private readonly overlay = inject(Overlay);
  @ViewChild('trigger', { read: ElementRef }) private trigger?: ElementRef<HTMLButtonElement>;
  private readonly view = inject(ViewContainerRef);
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly id = `tc-help-tip-${nextHelpTipId++}`;
  private overlayRef?: OverlayRef;
  private hovered = false;
  private focused = false;
  private touchPinned = false;
  private pointerType = '';
  private previousDescription: string | null = null;
  private readonly viewportSubscription: Subscription;

  constructor() {
    this.viewportSubscription = inject(ViewportRuler).change().subscribe(() => this.hide());
  }

  pointerDown(event: PointerEvent) {
    this.pointerType = event.pointerType;
  }

  pointerEnter(event: PointerEvent) {
    this.hovered = true;
    if (event.pointerType !== 'touch') this.show();
  }

  pointerLeave() {
    this.hovered = false;
    if (!this.focused && !this.touchPinned) this.hide();
  }

  focus() {
    this.focused = true;
    if (this.pointerType !== 'touch') this.show();
  }

  blur() {
    this.focused = false;
    this.pointerType = '';
    if (!this.hovered) this.hide();
  }

  click(event: MouseEvent) {
    if (this.pointerType === 'touch') {
      this.touchPinned = !this.touchPinned;
      if (this.touchPinned) this.show();
      else this.hide();
      return;
    }
    // Keyboard activation keeps the focus-triggered tooltip open.
    if (event.detail === 0 && this.focused) this.show();
  }

  hide() {
    this.touchPinned = false;
    if (!this.overlayRef) return;
    this.overlayRef.dispose();
    this.overlayRef = undefined;
    this.restoreDescription();
  }

  private show() {
    const entry = this.entry();
    const trigger = this.trigger?.nativeElement;
    if (!entry || !trigger || this.overlayRef?.hasAttached()) return;
    const position = this.overlay
      .position()
      .flexibleConnectedTo(trigger)
      .withScrollableContainers(this.scrollDispatcher.getAncestorScrollContainers(trigger))
      .withPositions([
        { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
        { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
      ])
      .withViewportMargin(8)
      .withPush(true);
    const ref = this.overlay.create({
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    this.overlayRef = ref;
    const tooltip = ref.attach(new ComponentPortal(NavTooltipComponent, this.view));
    tooltip.setInput('text', entry.text);
    tooltip.setInput('tooltipId', this.id);
    this.previousDescription = trigger.getAttribute('aria-describedby');
    trigger.setAttribute(
      'aria-describedby',
      [this.previousDescription, this.id].filter(Boolean).join(' '),
    );
    ref.detachments().subscribe(() => this.restoreDescription());
    position.positionChanges.subscribe(({ scrollableViewProperties }) => {
      if (scrollableViewProperties.isOriginOutsideView) this.hide();
    });
  }

  private restoreDescription() {
    const trigger = this.trigger?.nativeElement;
    if (!trigger) return;
    if (this.previousDescription === null)
      trigger.removeAttribute('aria-describedby');
    else trigger.setAttribute('aria-describedby', this.previousDescription);
  }

  ngOnDestroy() {
    this.hide();
    this.viewportSubscription.unsubscribe();
  }
}
