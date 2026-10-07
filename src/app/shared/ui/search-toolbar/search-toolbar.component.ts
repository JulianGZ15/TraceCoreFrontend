import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../icon/icon.component';
import { FilterChip } from '../filter-model';

@Component({
  selector: 'tc-search-toolbar',
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './search-toolbar.component.html',
  styleUrl: './search-toolbar.component.scss',
})
export class SearchToolbarComponent {
  readonly label = input<string>('Buscar');
  readonly placeholder = input<string>('Buscar…');
  readonly value = input<string>('');
  readonly chips = input<FilterChip[]>([]);
  readonly count = input<number>(0);
  readonly busy = input<boolean>(false);
  readonly showSearch = input<boolean>(true);
  readonly showFilters = input<boolean>(true);
  readonly maxlength = input<number>(150);

  readonly search = output<string>();
  readonly openFilters = output<void>();
  readonly remove = output<FilterChip>();
  readonly removeChip = output<FilterChip>();
  readonly clear = output<void>();
  readonly clearAll = output<void>();

  readonly term = signal<string>('');

  constructor() {
    effect(() => {
      this.term.set(this.value() ?? '');
    });
  }

  submitSearch(): void {
    this.search.emit(this.term().trim());
  }

  clearSearch(): void {
    this.term.set('');
    this.search.emit('');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitSearch();
    }
  }

  onRemove(chip: FilterChip): void {
    this.remove.emit(chip);
    this.removeChip.emit(chip);
  }

  onClear(): void {
    this.clear.emit();
    this.clearAll.emit();
  }
}
