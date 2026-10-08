import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'tc-skeleton',
  imports: [],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class Skeleton {
  readonly variant = input<'table' | 'form' | 'dossier' | 'cards' | 'line' | 'text'>('line');
  readonly rows = input<number>(4);
  readonly columns = input<number>(4);
  readonly label = input<string>('Cargando información...');

  readonly rowList = computed(() => Array.from({ length: Math.max(1, this.rows()) }, (_, i) => i));
  readonly columnList = computed(() => Array.from({ length: Math.max(1, this.columns()) }, (_, i) => i));
}
export { Skeleton as SkeletonComponent };
