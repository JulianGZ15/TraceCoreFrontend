import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'tc-pagination',
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class Pagination {
  readonly offset = input(0);
  readonly limit = input(25);
  readonly count = input(0);
  readonly busy = input(false);
  readonly hasMore = input<boolean | undefined>(undefined);
  readonly move = output<number>();
  readonly resize = output<number>();
}
