import { EditorDialog } from './editor-dialog.component';
import { render } from '../../../testing/component-test';
import { FormControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
describe('EditorDialog', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(EditorDialog, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });
});
it('keeps a draft after a version conflict without retrying the mutation', async () => {
  const fixture = await render(EditorDialog);
  const editor = fixture.componentInstance;
  editor.form.addControl('name', new FormControl('Draft'));
  editor.data.save = vi.fn().mockRejectedValue(new HttpErrorResponse({ status: 409 }));
  await editor.submit();
  expect(editor.form.getRawValue()['name']).toBe('Draft');
  expect(editor.conflict()).toBe(true);
  expect(editor.data.save).toHaveBeenCalledOnce();
});
