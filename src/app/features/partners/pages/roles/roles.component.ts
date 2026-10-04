import { Component } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Role } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';

import { PeriodEditorComponent } from '../../editors/period-editor/period-editor.component';

@Component({
  selector: 'tc-party-roles',
  imports: [Feedback, Pagination],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent extends SectionPage<Role> {
  readonly kind = 'roles' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  async edit() {
    await this.open(PeriodEditorComponent, {
      title: 'Asignar rol al tercero',
      party: this.uuid,
      kind: this.kind,
      mode: 'role',
    });
  }
}
