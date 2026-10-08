import { Directive, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { displayInstant } from '../instant';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, combineLatest } from 'rxjs';
import { WorkspaceApi, Params } from '../../core/http/workspace-api';
import { workspaceError as errorMessage } from '../../core/http/workspace-api';

@Directive()
export abstract class ReadPage implements OnDestroy {
  readonly api = inject(WorkspaceApi);
  readonly session = this.api.session;
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly initialLoading = signal(true);
  readonly updating = signal(false);
  readonly busy = signal(false);
  readonly notice = signal('');
  protected stop = new Subject<void>();
  protected sequence = 0;
  protected hasLoaded = false;
  private lastQueryKey = '';
  offset = 0;
  limit = 25;

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed())
      .subscribe(([p, q]) => {
        const nextOffset = Math.max(0, Number(q.get('offset')) || 0);
        const nextLimit = [25, 50, 100].includes(Number(q.get('limit')))
          ? Number(q.get('limit'))
          : 25;
        const currentKey = `${Array.from(p.keys)
          .map((k) => `${k}=${p.get(k)}`)
          .join('&')}|${Array.from(q.keys)
          .map((k) => `${k}=${q.get(k)}`)
          .join('&')}`;

        if (this.hasLoaded && this.lastQueryKey !== currentKey) {
          this.hasLoaded = false;
          this.initialLoading.set(true);
        }
        this.lastQueryKey = currentKey;
        this.offset = nextOffset;
        this.limit = nextLimit;
        queueMicrotask(() => void this.load());
      });

    this.session.ended.pipe(takeUntilDestroyed()).subscribe(() => {
      this.sequence++;
      this.stop.next();
      this.clear();
      this.loading.set(false);
      this.initialLoading.set(false);
      this.updating.set(false);
      this.hasLoaded = false;
    });
  }

  protected clear() {}

  time(value: unknown) {
    return displayInstant(value, this.session.context()?.company?.timezone ?? 'UTC');
  }

  abstract load(): Promise<void>;

  protected async read<T>(work: () => Promise<T>, apply: (value: T) => void) {
    const request = ++this.sequence,
      epoch = this.session.epoch();
    this.stop.next();
    if (!this.hasLoaded) {
      this.clear();
      this.initialLoading.set(true);
      this.updating.set(false);
    } else {
      this.updating.set(true);
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await work();
      if (request === this.sequence && epoch === this.session.epoch() && this.session.valid()) {
        apply(result);
        this.hasLoaded = true;
      }
    } catch (e) {
      if (request === this.sequence && epoch === this.session.epoch() && this.session.valid()) {
        this.error.set(errorMessage(e));
      }
    } finally {
      if (request === this.sequence) {
        this.loading.set(false);
        this.initialLoading.set(false);
        this.updating.set(false);
      }
    }
  }

  change(params: Params) {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  move(offset: number) {
    void this.change({ offset });
  }

  resize(limit: number) {
    void this.change({ limit, offset: 0 });
  }

  ngOnDestroy() {
    this.sequence++;
    this.stop.next();
    this.stop.complete();
  }
}
