import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

export interface StepperStep {
  readonly label: string;
}

export type StepperMode = 'navigable' | 'progress';
type StepState = 'completed' | 'current' | 'pending';

interface StepperItem {
  readonly label: string;
  readonly number: number;
  readonly state: StepState;
}

@Component({
  selector: 'tc-stepper',
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent implements AfterViewChecked {
  readonly steps = input.required<readonly StepperStep[]>();
  readonly currentStep = input.required<number>();
  readonly mode = input<StepperMode>('progress');
  readonly ariaLabel = input('Progreso del proceso');
  readonly terminalStatus = input('');
  readonly stepSelected = output<number>();
  readonly list = viewChild<ElementRef<HTMLOListElement>>('stepList');

  private lastScrolledStep = Number.NaN;

  get items(): StepperItem[] {
    const steps = this.steps();
    const position = Math.max(0, Math.min(steps.length + 1, Math.trunc(this.currentStep())));
    const terminal = !!this.terminalStatus();

    return steps.map(({ label }, index) => {
      const number = index + 1;
      const state: StepState = terminal
        ? number <= position
          ? 'completed'
          : 'pending'
        : number < position
          ? 'completed'
          : number === position
            ? 'current'
            : 'pending';
      return { label, number, state };
    });
  }

  ngAfterViewChecked(): void {
    const current = this.currentStep();
    if (current === this.lastScrolledStep) return;
    this.lastScrolledStep = current;
    this.scrollCurrentStepIntoView();
  }

  select(number: number): void {
    if (this.mode() === 'navigable' && number !== this.currentStep()) {
      this.stepSelected.emit(number);
    }
  }

  stateLabel(state: StepState): string {
    return state === 'completed' ? 'Completado' : state === 'current' ? 'Paso actual' : 'Pendiente';
  }

  private scrollCurrentStepIntoView(): void {
    const list = this.list()?.nativeElement;
    const active = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !active) return;

    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    if (activeRect.left < listRect.left) {
      list.scrollLeft += activeRect.left - listRect.left - 12;
    } else if (activeRect.right > listRect.right) {
      list.scrollLeft += activeRect.right - listRect.right + 12;
    }
  }
}
