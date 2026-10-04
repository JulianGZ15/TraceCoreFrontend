import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Session } from '../../../core/auth/session';
@Component({
  selector: 'tc-message',
  imports: [RouterLink],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessagePage {
  readonly session = inject(Session);
  readonly missing = inject(ActivatedRoute).snapshot.data['missing'] === true;
}
