import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { QualityPage } from './page-base';
import { qualityTestProviders } from './testing';

class PageHarness extends QualityPage {
  changeResource() {
    this.generation++;
  }
}

describe('respuestas de calidad y ciclo de sesión', () => {
  it('mantiene bloqueadas las acciones hasta finalizar el cierre del diálogo', async () => {
    const setup = qualityTestProviders();
    const closed = new Subject<unknown>();
    TestBed.configureTestingModule({
      providers: [...setup.providers, { provide: Dialog, useValue: { open: () => ({ closed }) } }],
    });
    const page = TestBed.runInInjectionContext(() => new PageHarness());
    const result = page.editor(class Editor {}, {}, 'Editar registro');
    expect(page.busy()).toBe(true);
    closed.next({ version: 1 });
    closed.complete();
    await expect(result).resolves.toEqual({ version: 1 });
    expect(page.busy()).toBe(false);
    page.ngOnDestroy();
  });
  it('ignora una escritura completada después de cambiar de recurso', async () => {
    const setup = qualityTestProviders();
    TestBed.configureTestingModule({ providers: setup.providers });
    const page = TestBed.runInInjectionContext(() => new PageHarness());
    let resolve!: (value: string) => void;
    const response = new Promise<string>((r) => (resolve = r));
    const after = vi.fn();
    const saving = page.mutate(() => response, after);
    page.changeResource();
    resolve('confirmed');
    await saving;
    expect(after).not.toHaveBeenCalled();
    expect(page.success()).toBe('');
    page.ngOnDestroy();
  });

  it('ignora errores de consultas anteriores y limpia al terminar sesión', async () => {
    const setup = qualityTestProviders();
    TestBed.configureTestingModule({ providers: setup.providers });
    const page = TestBed.runInInjectionContext(() => new PageHarness());
    let reject!: (error: Error) => void;
    const response = new Promise<string>((_, r) => (reject = r));
    const applying = vi.fn();
    const loading = page.request(() => response, applying);
    setup.session.ended.next();
    reject(new Error('Respuesta anterior'));
    await loading;
    expect(applying).not.toHaveBeenCalled();
    expect(page.error()).toBe('');
    page.ngOnDestroy();
  });
});
