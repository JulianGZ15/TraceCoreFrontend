import {
  Component,
  input,
  inject,
  signal,
  computed,
  effect,
  forwardRef,
  output,
  OnDestroy,
  untracked,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { CommerceApi } from '../../commerce-api';
import { Option, Summary } from '../../models';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
import { EntityLabelResolver } from '../../../../shared/ui/entity-label-resolver';
@Component({
  selector: 'tc-commerce-lookup',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LookupComponent), multi: true },
  ],
  imports: [EntitySearchComponent],
  templateUrl: './lookup.component.html',
  styleUrl: './lookup.component.scss',
})
export class LookupComponent implements ControlValueAccessor, OnDestroy {
  readonly api = inject(CommerceApi);
  private readonly labels = inject(EntityLabelResolver);
  readonly resource = input('party-options');
  readonly value = input<string | undefined>();
  readonly selectedChange = output<string>();
  readonly yard = input('');
  readonly params = input<Record<string, string>>({});
  readonly title = input('Seleccionar');
  readonly options = signal<Option[]>([]);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly disabled = signal(false);
  readonly selected = signal('');
  readonly selectedLabel = signal('');
  readonly suggestions = computed(() => this.options().map((option) => ({ value: option.uuid, label: option.label })));
  private search = '';
  private seq = 0;
  private configKey = '';
  private readonly resolvingSelections = new Set<string>();
  private labelSequence = 0;
  private stop = new Subject<void>();
  private change: (v: string) => void = () => {};
  private touch = () => {};
  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined) {
        this.selected.set(v);
        this.updateSelectedLabel(v);
      }
    });
    effect(() => {
      const resource = this.resource();
      const params = this.params();
      const yard = this.yard();
      const key = JSON.stringify([
        resource,
        yard,
        Object.entries(params).sort(([left], [right]) => left.localeCompare(right)),
      ]);
      if (key === this.configKey) return;
      this.configKey = key;
      this.search = '';
      void untracked(() => this.load(''));
    });
  }
  readonly searchOptions = (query: string): Promise<EntityOption[]> => this.load(query);

  async load(query = this.search): Promise<EntityOption[]> {
    this.stop.next();
    const seq = ++this.seq,
      epoch = this.api.session.epoch();
    if (!this.yard() || !this.api.session.valid()) return [];
    this.search = query;
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.get<Option[]>(
        '/' + this.resource(),
        {
          ...this.params(),
          yardUuid: this.yard(),
          search: query,
          offset: 0,
          limit: 25,
        },
        this.stop,
      );
      if (seq === this.seq && epoch === this.api.session.epoch()) {
        const options = rows.map((v: Option) => {
            const row = v as unknown as {
              record?: { uuid: string; concept?: string; filename?: string; folio?: string };
              label?: string;
            };
            return row.record
              ? {
                  uuid: row.record.uuid,
                  label:
                    row.label ||
                    row.record.concept ||
                    row.record.filename ||
                    row.record.folio ||
                    'Registro disponible',
                }
              : v;
          });
        this.options.set(options);
        if (this.selected()) this.updateSelectedLabel(this.selected());
        return options.map((option) => ({ value: option.uuid, label: option.label }));
      }
    } catch {
      if (seq === this.seq) this.error.set('No se pudo consultar el selector.');
    } finally {
      if (seq === this.seq) this.busy.set(false);
    }
    return [];
  }
  choose(option: EntityOption | null) {
    const value = option?.value ?? '';
    this.selectedLabel.set(option?.label ?? '');
    this.selected.set(value);
    this.change(value);
    this.touch();
    this.selectedChange.emit(value);
  }
  writeValue(v: string | null) {
    this.selected.set(v ?? '');
    this.updateSelectedLabel(v ?? '');
  }

  private updateSelectedLabel(uuid: string): void {
    const sequence = ++this.labelSequence;
    if (!uuid) {
      this.selectedLabel.set('');
      return;
    }
    const option = this.options().find((item) => item.uuid === uuid);
    if (option) {
      this.selectedLabel.set(option.label);
      return;
    }
    this.selectedLabel.set('Registro seleccionado');
    if (this.resource() !== 'orders/directory' || this.resolvingSelections.has(uuid)) return;
    this.resolvingSelections.add(uuid);
    const epoch = this.api.session.epoch();
    void this.resolveOrderLabel(uuid, sequence, epoch).finally(() => {
      this.resolvingSelections.delete(uuid);
    });
  }

  private async resolveOrderLabel(uuid: string, sequence: number, epoch: number): Promise<void> {
    try {
      const summary = await this.api.get<Summary>('/orders/' + uuid + '/summary');
      const party = await this.labels.resolveParty(summary.order.partyUuid);
      if (
        sequence === this.labelSequence &&
        epoch === this.api.session.epoch() &&
        this.selected() === uuid
      ) {
        const order = summary.order;
        const identity = `${order.series}-${order.type}-${order.folio}`;
        this.selectedLabel.set(`${identity} · ${party}`);
      }
    } catch {
      if (sequence === this.labelSequence && this.selected() === uuid)
        this.selectedLabel.set('Orden seleccionada');
    }
  }
  registerOnChange(fn: (v: string) => void) {
    this.change = fn;
  }
  registerOnTouched(fn: () => void) {
    this.touch = fn;
  }
  setDisabledState(v: boolean) {
    this.disabled.set(v);
  }
  ngOnDestroy() {
    ++this.seq;
    this.stop.next();
    this.stop.complete();
  }
}
