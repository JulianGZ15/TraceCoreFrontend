import { Directive, OnDestroy, inject, signal, Type } from '@angular/core';
import { ActivatedRoute, Router, CanDeactivateFn } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { Subject, Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { Session } from '../../core/auth/session';
import { errorMessage } from '../../core/http/api';
import { confirm } from '../../shared/ui/editor';
import { RfidAccess } from './access';
import { RfidApi } from './rfid-api';
import { label, prettyDate } from './rules';
@Directive()
export abstract class RfidPage implements OnDestroy {
  readonly api = inject(RfidApi);
  readonly access = inject(RfidAccess);
  readonly session = inject(Session);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly dialog = inject(Dialog);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly conflict = signal(false);
  readonly id = signal('');
  readonly yard = signal('');
  readonly offset = signal(0);
  readonly limit = signal(25);

  readonly label = label;

  protected alive = true;
  protected generation = 0;
  protected stop = new Subject<void>();
  private subscription?: Subscription;
  private ended = this.session.ended.subscribe(() => {
    this.alive = false;
    this.generation++;
    this.stop.next();
    this.clear();
  });
  private pollTimer?: ReturnType<typeof setTimeout>;
  private pollAction?:()=>Promise<void>;
  private visibility=()=>{ if(document.visibilityState==='visible'&&this.pollAction&&!this.error())this.armPoll();else if(this.pollTimer)clearTimeout(this.pollTimer); };
  follow(action:()=>Promise<void>){this.pollAction=action;document.addEventListener('visibilitychange',this.visibility);this.armPoll();}
  private armPoll(){if(this.pollTimer)clearTimeout(this.pollTimer);if(!this.alive||!this.session.valid()||document.visibilityState!=='visible')return;
   this.pollTimer=setTimeout(async()=>{if(!this.busy()&&this.pollAction)await this.pollAction();if(!this.error())this.armPoll();},5000);}
  resume(){this.error.set('');this.armPoll();}
  protected clear() {}
  watch(load: () => Promise<void>) {
    this.subscription?.unsubscribe();
    this.subscription = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(
      ([p, q]) => {
        this.stop.next();
        this.generation++;
        this.id.set(p.get('uuid') ?? '');
        this.yard.set(q.get('yardUuid') ?? '');
        this.offset.set(Math.max(0, parseInt(q.get('offset') ?? '0', 10) || 0));
        this.limit.set(
          [10, 25, 50, 100].includes(parseInt(q.get('limit') ?? '', 10))
            ? parseInt(q.get('limit')!, 10)
            : 25,
        );
        void load();
      },
    );
  }
  get<T>(path: string, params: Record<string, string | number | null | undefined> = {}) {
    return this.api.get<T>(path, params, this.stop);
  }
  async request<T>(fetch: () => Promise<T>, apply: (value: T) => void) {
    const g = ++this.generation,
      e = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    try {
      const r = await fetch();
      if (this.alive && g === this.generation && e === this.session.epoch()) apply(r);
    } catch (error) {
      if (this.alive && g === this.generation && e === this.session.epoch())
        this.error.set(
          error instanceof Error && !('status' in error) ? error.message : errorMessage(error),
        );
    } finally {
      if (this.alive && g === this.generation) this.busy.set(false);
    }
  }
  async mutate<T>(save: () => Promise<T>, after: (r: T) => void | Promise<void>) {
    if (this.busy()) return;
    const epoch = this.session.epoch(),
      generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    this.conflict.set(false);
    try {
      const r = await save();
      if (this.alive && generation === this.generation && epoch === this.session.epoch()) {
        this.success.set('OperaciÃ³n confirmada.');
        await after(r);
      }
    } catch (e) {
      if (this.alive && generation === this.generation && epoch === this.session.epoch()) {
        this.conflict.set(!!e && typeof e === 'object' && 'status' in e && e.status === 409);
        this.error.set(e instanceof Error && !('status' in e) ? e.message : errorMessage(e));
      }
    } finally {
      if (this.alive && generation === this.generation) this.busy.set(false);
    }
  }
  date(value: string | null) {
    return value
      ? prettyDate(value, this.session.context()?.company.timezone ?? 'UTC')
      : 'Sin fecha';
  }
  page(offset: number) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { offset },
      queryParamsHandling: 'merge',
    });
  }
  filter(values: Record<string, string | null>) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...values, offset: 0 },
      queryParamsHandling: 'merge',
    });
  }
  async editor<T>(component: Type<T>, data: unknown, label: string) {
    if (this.busy()) return undefined;
    this.busy.set(true);
    try {
      const ref = this.dialog.open<unknown>(component, {
        data,
        ariaLabel: label,
        disableClose: true,
        width: 'min(720px,calc(100vw - 32px))',
        maxHeight: 'calc(100dvh - 32px)',
      });
      return await firstValueFrom(ref.closed);
    } finally {
      if (this.alive) this.busy.set(false);
    }
  }
  async discard() {
    return confirm(this.dialog, 'Descartar cambios', 'Los cambios sin guardar se perderÃ¡n.');
  }
  ngOnDestroy() {
    this.alive = false;
    if(this.pollTimer)clearTimeout(this.pollTimer);
    document.removeEventListener('visibilitychange',this.visibility);
    this.generation++;
    this.stop.next();
    this.stop.complete();
    this.subscription?.unsubscribe();
    this.ended.unsubscribe();
    this.clear();
  }
}
export const rfidDirtyGuard: CanDeactivateFn<{
  form?: FormGroup;
  file?: () => File | null;
  busy?: () => boolean;
  discard: () => Promise<boolean>;
  session: Session;
}> = async (c) => !c.session.valid() || (!c.form?.dirty && !c.file?.()) || (await c.discard());
