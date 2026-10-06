import { Component, input, inject } from '@angular/core';
import { Session } from '../../../../core/auth/session';
import { RouterLink, RouterLinkActive } from '@angular/router';
@Component({
  selector: 'tc-logistics-section-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './section-nav.component.html',
  styleUrl: './section-nav.component.scss',
})
export class SectionNavComponent {
  readonly session = inject(Session);
  readonly base = input('');
  readonly sections = input<{ key: string; label: string }[]>([]);
}
