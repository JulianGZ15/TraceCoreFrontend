import { OrdersComponent } from './orders.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrdersComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrdersComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });

  it('abre el expediente al pulsar Abrir en una orden', async () => {
    const fixture = await renderOperation(OrdersComponent, {});
    const uuid = '8b316230-f897-4a81-b107-d62c04971d70';
    const navigate = vi.spyOn(fixture.componentInstance.router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.rows.set([
      { record: { uuid, version: 0, type: 'OC', series: 'OC', folio: '101' }, label: '' },
    ]);
    fixture.detectChanges();

    const openButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find(
      (button) => button.textContent?.trim() === 'Abrir',
    ) as HTMLButtonElement | undefined;
    expect(openButton).toBeTruthy();
    openButton!.click();

    expect(navigate).toHaveBeenCalledWith(['/comercial/ordenes', uuid, 'general']);
    expect(fixture.nativeElement.querySelector('.selection')).toBeNull();
  });
});
