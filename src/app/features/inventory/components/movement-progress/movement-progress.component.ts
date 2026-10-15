import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StepperComponent, StepperStep } from '../../../../shared/ui/stepper/stepper.component';
import { MovementDetail } from '../../models';

@Component({
  selector: 'tc-inventory-movement-progress',
  imports: [StepperComponent],
  templateUrl: './movement-progress.component.html',
  styleUrl: './movement-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementProgressComponent {
  readonly detail = input<MovementDetail | null>(null);
  readonly steps: readonly StepperStep[] = [
    { label: 'Preparación' },
    { label: 'En tránsito' },
    { label: 'Recepción' },
  ];

  readonly progress = computed(() => {
    const detail = this.detail();
    const movement = detail?.movement;
    if (!detail || detail.logisticsManaged !== false || !movement || !this.isMultiStage(detail)) {
      return null;
    }

    if (movement.state === 'DRAFT') return { currentStep: 1, terminalStatus: '' };
    if (movement.state === 'IN_TRANSIT') return { currentStep: 2, terminalStatus: '' };
    if (movement.state === 'COMPLETED')
      return { currentStep: this.steps.length + 1, terminalStatus: '' };
    if (movement.state === 'CANCELLED') {
      return { currentStep: 1, terminalStatus: 'Movimiento cancelado' };
    }
    return null;
  });

  private isMultiStage(detail: MovementDetail): boolean {
    const movement = detail.movement;
    return (
      movement.type === 'OUTBOUND' ||
      movement.type === 'RETURN' ||
      (movement.type === 'TRANSFER' && movement.sourceYardUuid !== movement.destinationYardUuid)
    );
  }
}
