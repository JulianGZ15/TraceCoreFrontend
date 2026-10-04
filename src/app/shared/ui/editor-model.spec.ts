import { FormControl } from '@angular/forms';
import { newPassword } from './editor-model';
describe('New password validation', () => {
  it('requires at least twelve characters', () => {
    expect(newPassword(new FormControl('12345678901'))).toEqual({ password: true });
    expect(newPassword(new FormControl('123456789012'))).toBeNull();
  });
  it('limits UTF-8 bytes rather than just string length', () => {
    expect(newPassword(new FormControl('é'.repeat(36)))).toBeNull();
    expect(newPassword(new FormControl('é'.repeat(37)))).toEqual({ password: true });
  });
});
