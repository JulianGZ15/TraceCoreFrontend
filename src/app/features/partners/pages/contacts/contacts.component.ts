import { Component } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Contact } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordEditorComponent } from '../../editors/record-editor/record-editor.component';

import { contactFields } from '../../record-fields';

@Component({
  selector: 'tc-party-contacts',
  imports: [Feedback, Pagination],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
})
export class ContactsComponent extends SectionPage<Contact> {
  readonly kind = 'contacts' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  async edit(row?: Contact) {
    await this.open(RecordEditorComponent, {
      title: row ? 'Editar contacto' : 'Nuevo contacto',
      party: this.uuid,
      kind: this.kind,
      row,
      fields: contactFields,
      initial: row ? { ...row } : { active: true, primary: false },
    });
  }
}
