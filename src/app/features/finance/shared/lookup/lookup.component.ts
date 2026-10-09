import {
  Component,
  input,
  inject,
  signal,
  effect,
  forwardRef,
  output,
  OnDestroy,
  computed,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { FinanceApi } from '../../finance-api';
import { Option } from '../../models';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
let nextLookupId = 0;
@Component({
  selector: 'tc-finance-lookup',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LookupComponent), multi: true },
  ],
  imports: [EntitySearchComponent],
  templateUrl: './lookup.component.html',
  styleUrl: './lookup.component.scss',
})
export class LookupComponent implements ControlValueAccessor, OnDestroy {
  readonly api = inject(FinanceApi);
  readonly resource = input('party-options');
  readonly value = input<string | undefined>();
  readonly selectedChange = output<string>();
  readonly yard = input('');
  readonly params = input<Record<string, string>>({});
  readonly title = input('Seleccionar');
  readonly showLabel = input(true);
  readonly controlId = input('');
  private readonly generatedId = 'finance-option-' + ++nextLookupId;
  readonly id = computed(() => this.controlId() || this.generatedId);
  readonly options = signal<Option[]>([]);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly disabled = signal(false);
  readonly selected = signal('');
  readonly selectedLabel = signal('');
  readonly suggestions = computed(() => this.options().map((option) => ({ value: option.uuid, label: option.label })));
  private search = '';
  private seq = 0;
  private stop = new Subject<void>();
  private change: (v: string) => void = () => {};
  private touch = () => {};
  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined) this.selected.set(v);
    });
    effect(() => {
      this.resource();
      this.params();
      this.yard();
      this.search = '';
      void this.load('');
    });
  }
  readonly searchOptions = (query: string): Promise<EntityOption[]> => this.load(query);

  async load(query = this.search): Promise<EntityOption[]> {
    this.stop.next();
    const seq = ++this.seq,
      epoch = this.api.session.epoch();
    if (
      !this.api.session.can('FINANCE_READ') ||
      !this.api.session.valid() ||
      (['charge-options', 'invoice-options', 'payment-options'].includes(this.resource()) &&
        (!this.params()['partyUuid'] ||
          !this.params()['currency'] ||
          !this.params()['direction'])) ||
      (this.resource() === 'charge-origins' && !this.params()['orderUuid']) ||
      (this.resource() === 'evidence' && !this.params()['partyUuid'])
    ) return [];
    this.search = query;
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.get<Option[]>(
        '/' + this.resource(),
        {
          ...this.params(),

          search: query,
          offset: 0,
          limit: 25,
        },
        this.stop,
      );
      if (seq === this.seq && epoch === this.api.session.epoch()) {
        const options = rows.map((v: Option) => {
            const row = v as unknown as {
              record?: {
                uuid: string;
                concept?: string;
                filename?: string;
                folio?: string;
                maxWeightKgExact?: string;
                maxPositions?: number;
                licenseExpiresAt?: string;
              };
              label?: string;
            };
            return row.record
              ? {
                  uuid: row.record.uuid,
                  label:
                    [row.record.concept ?? row.record.filename ?? row.record.folio, row.label]
                      .filter(Boolean)
                      .join(' · ') || row.record.uuid,
                }
              : v;
          });
        this.options.set(options);
        if (this.selected()) this.selectedLabel.set(options.find((o) => o.uuid === this.selected())?.label ?? this.selected());
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
    this.selectedLabel.set(this.options().find((o) => o.uuid === v)?.label ?? '');
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
