import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DataTable } from '../shared/ui/data-table/data-table.component';
import { ListContainer } from '../shared/ui/list-container/list-container.component';
import { Pagination } from '../shared/ui/pagination/pagination.component';

@Component({
  imports: [DataTable, ListContainer, Pagination, ReactiveFormsModule],
  templateUrl: './data-table-host.component.html',
})
export class DataTableHost {
  readonly busy = signal(false);
  readonly visible = signal(true);
  readonly observation = new FormControl('Borrador original', { nonNullable: true });
  selected = false;
  opens = 0;
  offset = 0;
  readonly inList = signal(false);
}
