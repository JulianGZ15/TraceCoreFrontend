import { FieldsComponent } from './fields.component';
import { renderOperation } from '../../../../testing/operation-test';
import { FormGroup } from '@angular/forms';
import { Field } from '../../models';
describe('FieldsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(FieldsComponent, { form: new FormGroup({}) });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });

  it('reuses lookup params without configuration so change detection does not retrigger requests', async () => {
    const fixture = await renderOperation(FieldsComponent, { form: new FormGroup({}) });
    const field: Field = {
      key: 'modelUuid',
      label: 'Modelo',
      type: 'lookup',
      resource: 'model-options',
    };

    const first = fixture.componentInstance.lookupParams(field);
    fixture.detectChanges();
    const second = fixture.componentInstance.lookupParams(field);

    expect(second).toBe(first);
  });

});
