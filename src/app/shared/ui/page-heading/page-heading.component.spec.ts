import { PageHeading } from './page-heading.component';
import { render } from '../../../testing/component-test';

describe('PageHeading', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(PageHeading, {
      title: 'Organización',
      description: 'Gestión de la empresa y estructura de sedes.',
    });
    expect(fixture.componentInstance).toBeTruthy();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent).toContain('Organización');

    const desc = fixture.nativeElement.querySelector('.page-description');
    expect(desc?.textContent).toContain('Gestión de la empresa');

    // Comprobar que no exista el elemento repetido .eyebrow
    const eyebrow = fixture.nativeElement.querySelector('.eyebrow');
    expect(eyebrow).toBeNull();
  });
});
