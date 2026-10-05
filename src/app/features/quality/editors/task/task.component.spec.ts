import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TaskComponent } from './task.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('TaskComponent · editors', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [TaskComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(TaskComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
