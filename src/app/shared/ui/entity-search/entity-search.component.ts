import {
  Component,
  OnDestroy,
  input,
  output,
  signal,
  effect,
  ElementRef,
  viewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../icon/icon.component';

export interface EntityOption {
  value: string;
  label: string;
  meta?: string;
  disabled?: boolean;
}

@Component({
  selector: 'tc-entity-search',
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './entity-search.component.html',
  styleUrl: './entity-search.component.scss',
})
export class EntitySearchComponent implements OnDestroy {
  readonly label = input<string>('Buscar entidad');
  readonly placeholder = input<string>('Escribe para buscar…');
  readonly value = input<string>('');
  readonly selectedLabel = input<string>('');
  readonly optionsList = input<EntityOption[]>([]);
  readonly searchFn = input<(query: string) => Promise<EntityOption[]>>();
  readonly disabled = input<boolean>(false);
  readonly controlId = input<string>('');

  readonly select = output<EntityOption | null>();

  readonly query = signal<string>('');
  readonly options = signal<EntityOption[]>([]);
  readonly open = signal<boolean>(false);
  readonly busy = signal<boolean>(false);
  readonly activeIndex = signal<number>(-1);
  readonly currentLabel = signal<string>('');

  private debounceTimer?: ReturnType<typeof setTimeout>;
  private searchSequence = 0;
  private readonly containerRef = viewChild<ElementRef>('container');
  readonly listId = 'entity-search-list-' + crypto.randomUUID();
  readonly inputId = 'entity-search-input-' + crypto.randomUUID();
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly clearButton = viewChild<ElementRef<HTMLButtonElement>>('clearButton');

  constructor() {
    effect(() => this.options.set(this.optionsList()));
    effect(() => {
      const val = this.value();
      const lbl = this.selectedLabel();
      if (val && lbl) {
        this.currentLabel.set(lbl);
      } else if (!val) {
        this.currentLabel.set('');
      }
    });
  }

  onInput(text: string): void {
    this.query.set(text);
    this.activeIndex.set(-1);
    ++this.searchSequence;
    this.busy.set(false);
    this.options.set([]);
    this.open.set(false);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (!text.trim()) {
      if (this.searchFn()) void this.performSearch('');
      else {
        this.options.set([]);
        this.open.set(false);
      }
      return;
    }

    this.debounceTimer = setTimeout(() => {
      void this.performSearch(text.trim());
    }, 280);
  }

  onFocus(): void {
    this.open.set(true);
  }

  async performSearch(text: string): Promise<void> {
    const fn = this.searchFn();
    if (!fn) return;
    const sequence = ++this.searchSequence;

    this.busy.set(true);
    try {
      const results = await fn(text);
      if (sequence !== this.searchSequence) return;
      this.options.set(results);
      this.open.set(true);
    } catch {
      if (sequence !== this.searchSequence) return;
      this.options.set([]);
      this.open.set(true);
    } finally {
      if (sequence === this.searchSequence) this.busy.set(false);
    }
  }

  selectOption(option: EntityOption): void {
    if (option.disabled) return;
    this.currentLabel.set(option.label);
    this.query.set('');
    this.open.set(false);
    this.select.emit(option);
    setTimeout(() => this.clearButton()?.nativeElement.focus(), 0);
  }

  clearSelection(): void {
    this.currentLabel.set('');
    this.query.set('');
    this.open.set(false);
    this.select.emit(null);
    setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    if (!this.open() || opts.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => this.nextEnabled(i, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => this.nextEnabled(i, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.activeIndex();
      if (idx >= 0 && idx < opts.length) {
        this.selectOption(opts[idx]);
      }
    } else if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  private nextEnabled(from: number, direction: 1 | -1): number {
    const opts = this.options();
    if (from < 0) from = direction === 1 ? -1 : 0;
    for (let step = 1; step <= opts.length; step++) {
      const index = (from + direction * step + opts.length) % opts.length;
      if (!opts[index].disabled) return index;
    }
    return -1;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const container = this.containerRef()?.nativeElement as HTMLElement | undefined;
    if (container && !container.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
