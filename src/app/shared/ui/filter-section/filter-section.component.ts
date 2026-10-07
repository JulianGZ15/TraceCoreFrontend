import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tc-filter-section',
  imports: [CommonModule],
  templateUrl: './filter-section.component.html',
  styleUrl: './filter-section.component.scss',
})
export class FilterSectionComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
