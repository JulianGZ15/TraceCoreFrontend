import { RecordEditorComponent } from './record-editor.component';
import { renderPartner } from '../../testing';
import { contactFields } from '../../record-fields';
describe('RecordEditorComponent', () => {
  it('requires a communication channel and a phone for extensions', async () => {
    const { fixture, api } = await renderPartner(RecordEditorComponent, {
      data: {
        kind: 'contacts',
        fields: contactFields,
        initial: { name: 'Persona', active: true, primary: false },
      },
    });
    await expect(fixture.componentInstance.save()).rejects.toThrow('correo');
    fixture.componentInstance.form.patchValue({ email: 'a@example.test', extension: '10' });
    await expect(fixture.componentInstance.save()).rejects.toThrow('teléfono');
    expect(api.create).not.toHaveBeenCalled();
    fixture.componentInstance.form.patchValue({ phone: '+52551234' });
    await fixture.componentInstance.save();
    expect(api.create).toHaveBeenCalledWith(
      expect.any(String),
      'contacts',
      expect.objectContaining({ phone: '+52551234', extension: '10' }),
    );
  });
});
