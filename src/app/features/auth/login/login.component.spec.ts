import { LoginPage } from './login.component';
import { render } from '../../../testing/component-test';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Session } from '../../../core/auth/session';

describe('LoginPage', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(LoginPage, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });

  it('opens the home dashboard after a successful login', async () => {
    const session = {
      login: vi.fn(async () => {}), hasAccess: () => true, valid: () => false,
      notice: signal(''),
    };
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: Session, useValue: session }],
    }).compileComponents();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'ana@example.test', password: 'secret' });
    await component.submit();
    expect(session.login).toHaveBeenCalledWith('ana@example.test', 'secret');
    expect(navigate).toHaveBeenCalledWith('/inicio');
  });
});
