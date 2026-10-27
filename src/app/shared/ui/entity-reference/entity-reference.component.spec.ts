import { EntityReferenceComponent } from './entity-reference.component';
import { render } from '../../../testing/component-test';

describe('EntityReferenceComponent', () => {
  it('shows the supplied name and links to an authorized party dossier', async () => {
    const fixture = await render(EntityReferenceComponent, {
      kind: 'party',
      uuid: 'party-uuid',
      label: 'Transportes Sierra Madre',
    });

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement | null;
    expect(link?.textContent?.trim()).toBe('Transportes Sierra Madre');
    expect(link?.getAttribute('href')).toBe('/terceros/party-uuid/general');
    expect(fixture.nativeElement.textContent).not.toContain('party-uuid');
  });

  it('links a company reference to the active company record', async () => {
    const fixture = await render(EntityReferenceComponent, {
      kind: 'company',
      uuid: '00000000-0000-0000-0000-000000000001',
    });

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement | null;
    expect(link?.textContent?.trim()).toBe('TraceCore Test');
    expect(link?.getAttribute('href')).toBe('/organizacion/empresa');
  });

  it('does not expose the UUID when the name cannot be resolved', async () => {
    const fixture = await render(EntityReferenceComponent, {
      kind: 'party',
      uuid: 'unknown-party-uuid',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nombre no disponible');
    expect(fixture.nativeElement.textContent).not.toContain('unknown-party-uuid');
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });
});
