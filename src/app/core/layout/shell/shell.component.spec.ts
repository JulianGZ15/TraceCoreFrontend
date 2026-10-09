import { Shell } from './shell.component';
import { render } from '../../../testing/component-test';
describe('Shell sidebar preference', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it('starts collapsed and persists both choices', async () => {
    const fixture = await render(Shell);
    const shell = fixture.componentInstance;
    expect(shell.collapsed()).toBe(true);
    shell.toggleSidebar();
    expect(shell.collapsed()).toBe(false);
    expect(localStorage.getItem('tracecore.sidebar.collapsed')).toBe('false');
    shell.toggleSidebar();
    expect(localStorage.getItem('tracecore.sidebar.collapsed')).toBe('true');
  });
  it('restores the expanded choice', async () => {
    localStorage.setItem('tracecore.sidebar.collapsed', 'false');
    expect((await render(Shell)).componentInstance.collapsed()).toBe(false);
  });
  it('ignores an invalid stored value', async () => {
    localStorage.setItem('tracecore.sidebar.collapsed', 'invalid');
    expect((await render(Shell)).componentInstance.collapsed()).toBe(true);
  });
  it('keeps working when storage reads and writes throw', async () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const shell = (await render(Shell)).componentInstance;
    expect(shell.collapsed()).toBe(true);
    expect(() => shell.toggleSidebar()).not.toThrow();
    expect(shell.collapsed()).toBe(false);
  });
});
