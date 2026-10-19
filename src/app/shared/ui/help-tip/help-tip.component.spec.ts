import { HelpTipComponent } from './help-tip.component';
import { render } from '../../../testing/component-test';
import { helpEntry } from './help-catalog';

describe('Help tip', () => {
  it('shows a subdued, named help button only for catalogued terms', async () => {
    const fixture = await render(HelpTipComponent, { term: 'epc', label: 'EPC' });
    const button = fixture.nativeElement.querySelector('button');

    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Ayuda: EPC');
    expect(helpEntry('epc')?.source).toContain('GS1');

    expect(helpEntry('unlisted-field')).toBeNull();
  });

  it('associates the tooltip definition when the help button receives focus', async () => {
    const fixture = await render(HelpTipComponent, { term: 'epc', label: 'EPC' });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.focus();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(String(button.getAttribute('aria-describedby'))).toMatch(/^tc-help-tip-/);
    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
      'identifica el objeto',
    );

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });

  it('opens on pointer hover and supports a tap on touch devices', async () => {
    const fixture = await render(HelpTipComponent, { term: 'epc', label: 'EPC' });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const hover = new Event('pointerenter');
    Object.defineProperty(hover, 'pointerType', { value: 'mouse' });
    button.dispatchEvent(hover);
    fixture.detectChanges();

    expect(button.hasAttribute('aria-describedby')).toBe(true);
    button.dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();
    expect(button.hasAttribute('aria-describedby')).toBe(false);

    const touchDown = new Event('pointerdown');
    Object.defineProperty(touchDown, 'pointerType', { value: 'touch' });
    button.dispatchEvent(touchDown);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(button.hasAttribute('aria-describedby')).toBe(true);
  });
});
