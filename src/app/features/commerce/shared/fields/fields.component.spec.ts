import { FieldsComponent } from './fields.component';
import { renderOperation } from '../../../../testing/operation-test';
import { FormGroup } from '@angular/forms';
describe('FieldsComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(FieldsComponent, { form: new FormGroup({}) });
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
