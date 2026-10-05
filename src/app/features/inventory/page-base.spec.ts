import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { vi } from 'vitest';
import { InventoryForm, InventoryPage } from './page-base';
import { InventoryAccess } from './access';
import { inventoryTestProviders } from './testing';
import { safeReturn } from '../../core/auth/session';
class Draft extends InventoryForm {
  readonly form = new FormGroup({ reason: new FormControl('') });
  send(path: string, body: Record<string, unknown>) {
    return this.submitKeyed(path, body, () => {});
  }
}
class Reader extends InventoryPage {
  run<T>(task: () => Promise<T>, apply: (v: T) => void) {
    return this.request(task, apply);
  }
}
describe('Inventario: límites de sesión y comandos', () => {
  it('combina COMPANY/YARD únicamente en la política del módulo', () => {
    const s = inventoryTestProviders();
    s.session.context.set({
      company: { uuid: 'company', name: 'TraceCore', timezone: 'UTC', active: true },
      companyPermissions: ['INVENTORY_READ'],
      yards: [],
    });
    TestBed.configureTestingModule({ providers: s.providers });
    const a = TestBed.inject(InventoryAccess);
    expect(a.can('INVENTORY_READ', 'yard')).toBe(true);
    expect(s.session.can('INVENTORY_READ', 'yard')).toBe(false);
    expect(a.can('MOVEMENT_MANAGE', 'yard')).toBe(false);
  });
  it('conserva clave/payload ante resultado indeterminado y cambia clave al modificar datos', async () => {
    const s = inventoryTestProviders();
    s.api.post.mockRejectedValue({ status: 0 });
    TestBed.configureTestingModule({ providers: s.providers });
    const d = TestBed.runInInjectionContext(() => new Draft());
    await d.send('/movements', { reason: 'A' });
    expect(s.api.post).toHaveBeenCalledTimes(1);
    await d.send('/movements', { reason: 'A' });
    const first = s.api.post.mock.calls[0][1] as { requestKey: string };
    expect(s.api.post.mock.calls[1][1]).toEqual(first);
    await d.send('/movements', { reason: 'B' });
    expect((s.api.post.mock.calls[2][1] as { requestKey: string }).requestKey).not.toBe(
      first.requestKey,
    );
    d.ngOnDestroy();
  });
  it('coloca la clave de propuesta dentro del movimiento y limpia borradores al cerrar sesión', async () => {
    const s = inventoryTestProviders();
    s.api.post.mockRejectedValue({ status: 409 });
    TestBed.configureTestingModule({ providers: s.providers });
    const d = TestBed.runInInjectionContext(() => new Draft());
    d.form.controls.reason.setValue('Borrador');
    await d.send('/proposals', { movement: { type: 'TRANSFER' }, observations: [] });
    const body = s.api.post.mock.calls[0][1] as {
      movement: { requestKey: string };
      requestKey?: string;
    };
    expect(body.movement.requestKey).toMatch(/^[a-f0-9-]{36}$/);
    expect(body.requestKey).toBeUndefined();
    s.session.ended.next();
    expect(d.form.controls.reason.value).toBeNull();
    d.ngOnDestroy();
  });
  it('ignora respuestas de una sesión anterior', async () => {
    const s = inventoryTestProviders();
    TestBed.configureTestingModule({ providers: s.providers });
    const reader = TestBed.runInInjectionContext(() => new Reader());
    let resolve!: (v: string) => void;
    const apply = vi.fn();
    const pending = reader.run(() => new Promise<string>((r) => (resolve = r)), apply);
    s.session.epoch.update((v) => v + 1);
    resolve('viejo');
    await pending;
    expect(apply).not.toHaveBeenCalled();
    reader.ngOnDestroy();
  });
  it('acepta retornos internos de inventario y rechaza destinos externos', () => {
    expect(safeReturn('/inventario/patios?yardUuid=abc')).toContain('/inventario/patios');
    expect(safeReturn('//evil.test/inventario')).toBe('/inicio');
  });
  it('ignora la respuesta anterior después de cambiar filtros', async () => {
    const s = inventoryTestProviders();
    TestBed.configureTestingModule({ providers: s.providers });
    const reader = TestBed.runInInjectionContext(() => new Reader());
    let resolve!: (v: string) => void;
    const apply = vi.fn();
    const first = reader.run(() => new Promise<string>((r) => (resolve = r)), apply);
    await reader.run(async () => 'actual', apply);
    resolve('anterior');
    await first;
    expect(apply.mock.calls).toEqual([['actual']]);
    reader.ngOnDestroy();
  });
  it('distingue ausencia opcional de un contrato decimal incompatible', () => {
    const s = inventoryTestProviders();
    TestBed.configureTestingModule({ providers: s.providers });
    const reader = TestBed.runInInjectionContext(() => new Reader());
    expect(reader.optionalExact(null, null)).toBe('Sin dato');
    expect(reader.optionalExact(1, undefined)).toContain('incompatible');
    expect(reader.optionalExact(0, '999999999999.999999')).toBe('999999999999.999999');
    reader.ngOnDestroy();
  });
  it('un permiso YARD no habilita otro patio ni consultas COMPANY', () => {
    const s = inventoryTestProviders();
    s.session.context.set({
      company: { uuid: 'company', name: 'TraceCore', timezone: 'UTC', active: true },
      companyPermissions: [],
      yards: [
        {
          uuid: 'yard-a',
          permissions: ['INVENTORY_READ'],
        },
      ],
    });
    TestBed.configureTestingModule({ providers: s.providers });
    const access = TestBed.inject(InventoryAccess);
    expect(access.can('INVENTORY_READ', 'yard-a')).toBe(true);
    expect(access.can('INVENTORY_READ', 'yard-b')).toBe(false);
    expect(access.global('INVENTORY_READ')).toBe(false);
  });
});
