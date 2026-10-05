import { AssetHeaderComponent } from './asset-header.component';
import { render } from '../../../../testing/component-test';
describe('AssetHeaderComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(AssetHeaderComponent, {
      profile: {
        asset: { internalCode: 'Prueba', uuid: 'asset', lifecycle: 'REGISTERED' },
        category: { name: 'Categoría' },
        model: { code: 'M' },
        technicalSheet: { revision: 'A', state: 'APPROVED' },
        owner: { companyUuid: 'company' },
        condition: { condition: 'UNKNOWN' },
      },
    });
    expect(fixture.componentInstance).toBeTruthy();
    fixture.destroy();
  });
});
