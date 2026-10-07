import {
  Component,
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
}

@Component({
  selector: 'tc-entity-search',
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './entity-search.component.html',
  styleUrl: './entity-search.component.scss',
})
export class EntitySearchComponent {
  readonly label = input<string>('Buscar entidad');
  readonly placeholder = input<string>('Escribe para buscar…');
  readonly value = input<string>('');
  readonly selectedLabel = input<string>('');
  readonly searchFn = input<(query: string) => Promise<EntityOption[]>>();
  readonly disabled = input<boolean>(false);

  readonly select = output<EntityOption | null>();

  readonly query = signal<string>('');
  readonly options = signal<EntityOption[]>([]);
  readonly open = signal<boolean>(false);
  readonly busy = signal<boolean>(false);
  readonly activeIndex = signal<number>(-1);
  readonly currentLabel = signal<string>('');

  private debounceTimer?: ReturnType<typeof setTimeout>;
  private readonly containerRef = viewChild<ElementRef>('container');

  constructor() {
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

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (!text.trim()) {
      this.options.set([]);
      this.open.set(false);
      return;
    }

    this.debounceTimer = setTimeout(() => {
      void this.performSearch(text.trim());
    }, 280);
  }

  async performSearch(text: string): Promise<void> {
    const fn = this.searchFn();
    if (!fn) return;

    this.busy.set(true);
    try {
      const results = await fn(text);
      this.options.set(results);
      this.open.set(true);
    } catch {
      this.options.set([]);
    } finally {
      this.busy.set(false);
    }
  }

  selectOption(option: EntityOption): void {
    this.currentLabel.set(option.label);
    this.query.set('');
    this.open.set(false);
    this.select.emit(option);
  }

  clearSelection(): void {
    this.currentLabel.set('');
    this.query.set('');
    this.open.set(false);
    this.select.emit(null);
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    if (!this.open() || opts.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => (i + 1 < opts.length ? i + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => (i - 1 >= 0 ? i - 1 : opts.length - 1));
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const container = this.containerRef()?.nativeElement as HTMLElement | undefined;
    if (container && !container.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
