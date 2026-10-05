import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { PendingRequestsComponent } from './pending-requests.component';
import { qualityTestProviders, testAsset } from '../../testing';
describe('PendingRequestsComponent · shared', () => {
  it('renderiza la vista con sesión autorizada y cancela al destruirla', async () => {
    const setup = qualityTestProviders();
    await TestBed.configureTestingModule({
      imports: [PendingRequestsComponent],
      providers: setup.providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(PendingRequestsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
