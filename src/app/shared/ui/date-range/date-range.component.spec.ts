import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateRangeComponent, toIsoWithZone, fromIsoToLocal } from './date-range.component';
import { Session } from '../../../core/auth/session';

describe('DateRangeComponent', () => {
  let component: DateRangeComponent;
  let fixture: ComponentFixture<DateRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangeComponent],
      providers: [
        {
          provide: Session,
          useValue: {
            context: () => ({ company: { timezone: 'America/Mexico_City' } }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format ISO to local date and back', () => {
    const iso = '2026-05-10T14:30:00-06:00';
    const local = fromIsoToLocal(iso);
    expect(local).toBe('2026-05-10T14:30');

    const formatted = toIsoWithZone(local, 'America/Mexico_City');
    expect(formatted).toContain('2026-05-10T14:30:00');
  });

  it('should validate from <= to and emit rangeChange', () => {
    let result: { from: string; to: string } | undefined;
    component.rangeChange.subscribe((val: { from: string; to: string }) => {
      result = val;
    });

    component.onFromChange('2026-01-01T10:00');
    component.onToChange('2026-01-02T10:00');

    expect(component.error()).toBe('');
    expect(result).toBeDefined();
    expect(result!.from).toContain('2026-01-01T10:00:00');
    expect(result!.to).toContain('2026-01-02T10:00:00');
  });
});
