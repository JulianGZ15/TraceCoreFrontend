import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Party, Role } from '../../models';
import { Status } from '../../../../shared/ui/page';
import { label, validity } from '../../rules';
@Component({
  selector: 'tc-party-header',
  imports: [RouterLink, Status],
  templateUrl: './party-header.component.html',
  styleUrl: './party-header.component.scss',
})
export class PartyHeaderComponent {
  readonly party = input.required<Party>();
  readonly roles = input<Role[]>([]);
  readonly label = label;
  readonly state = validity;
}
