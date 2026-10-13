import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Session } from '../../../core/auth/session';
import { EntityLabelResolver } from '../entity-label-resolver';

@Component({
  selector: 'tc-entity-reference',
  imports: [RouterLink],
  templateUrl: './entity-reference.component.html',
  styleUrl: './entity-reference.component.scss',
})
export class EntityReferenceComponent {
  readonly kind = input.required<'company' | 'party'>();
  readonly uuid = input<string | null | undefined>(null);
  readonly label = input<unknown>();
  readonly name = signal('');
  readonly link = signal<string | null>(null);
  private readonly labels = inject(EntityLabelResolver);
  private readonly session = inject(Session);
  private request = 0;

  constructor() {
    effect(() => {
      const kind = this.kind();
      const uuid = this.uuid();
      const rawLabel = this.label();
      const supplied = typeof rawLabel === 'string' ? rawLabel.trim() : '';
      const request = ++this.request;
      this.name.set('');
      this.link.set(null);
      if (!uuid) return;

      const canView =
        kind === 'company'
          ? this.session.can('ORGANIZATION_READ') &&
            this.session.context()?.company.uuid === uuid
          : this.session.can('PARTY_READ');
      const target = canView
        ? kind === 'company'
          ? '/organizacion/empresa'
          : '/terceros/' + uuid + '/general'
        : null;

      if (supplied) {
        this.name.set(supplied);
        this.link.set(target);
        return;
      }

      void this.labels.resolveReference(kind, uuid).then((name) => {
        if (request === this.request) {
          this.name.set(name || 'Nombre no disponible');
          if (name) this.link.set(target);
        }
      });
    });
  }
}
