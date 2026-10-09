import { Component, input } from '@angular/core';
@Component({
  selector: 'tc-nav-tooltip',
  templateUrl: './nav-tooltip.component.html',
  styleUrl: './nav-tooltip.component.scss',
})
export class NavTooltipComponent {
  readonly text = input.required<string>();
  readonly tooltipId = input.required<string>();
}
