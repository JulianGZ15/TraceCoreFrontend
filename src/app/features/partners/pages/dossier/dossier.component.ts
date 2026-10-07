import { ContextualLinksComponent } from '../../../documents/shared/contextual-links/contextual-links.component';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DossierStore } from '../../dossier-store';
import { errorMessage } from '../../../../core/http/api';
import { Feedback } from '../../../../shared/ui/page';
import { PartyHeaderComponent } from '../../components/party-header/party-header.component';
import { SectionNavigationComponent } from '../../components/section-navigation/section-navigation.component';
import { uuidPattern } from '../../rules';
@Component({
  selector: 'tc-party-dossier',
  imports: [ContextualLinksComponent,RouterOutlet, Feedback, PartyHeaderComponent, SectionNavigationComponent],
  providers: [DossierStore],
  templateUrl: './dossier.component.html',
  styleUrl: './dossier.component.scss',
})
export class DossierComponent implements OnDestroy {
  readonly store = inject(DossierStore);
  private route = inject(ActivatedRoute);
  readonly error = signal('');
  readonly ready = signal(false);
  private generation = 0;
  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => void this.load(params.get('uuid') ?? ''));
  }
  async load(uuid = this.store.uuid) {
    const generation = ++this.generation;
    this.ready.set(false);
    this.error.set('');
    if (!uuidPattern.test(uuid)) {
      this.error.set('El UUID del tercero no es válido.');
      return;
    }
    try {
      await this.store.load(uuid);
      if (generation === this.generation) this.ready.set(true);
    } catch (e) {
      if (generation === this.generation) this.error.set(errorMessage(e));
    }
  }
  ngOnDestroy() {
    ++this.generation;
    this.store.dispose();
  }
}
