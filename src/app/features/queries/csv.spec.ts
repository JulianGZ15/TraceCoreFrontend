import { describe, it, expect, vi } from 'vitest';
import { HttpHeaders } from '@angular/common/http';
import { csvContinuation, CsvDownload } from './csv';
import { Subject } from 'rxjs';
import { WorkspaceApi } from '../../core/http/workspace-api';
describe('Continuación CSV', () => {
  it('lee continuidad explícita sin inventar total', () => {
    const h = new HttpHeaders({
      'X-Offset': '500',
      'X-Limit': '500',
      'X-Has-More': 'true',
      'X-Next-Offset': '1000',
      'X-Generated-At': '2026-10-06T00:00:00Z',
    });
    expect(csvContinuation(h).next).toBe(1000);
    expect(() => csvContinuation(h.delete('X-Has-More'))).toThrow();
    expect(() => csvContinuation(h.set('X-Next-Offset', '999'))).toThrow();
  });
  it('cancela al terminar sesión y libera la suscripción al salir de la página', () => {
    const ended = new Subject<void>();
    const csv = new CsvDownload({ session: { ended } } as unknown as WorkspaceApi);
    const reset = vi.spyOn(csv, 'reset');
    ended.next();
    expect(reset).toHaveBeenCalledOnce();
    csv.destroy();
    reset.mockClear();
    ended.next();
    expect(reset).not.toHaveBeenCalled();
  });
});
