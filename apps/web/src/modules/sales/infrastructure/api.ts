import { send } from '../../../shared/infrastructure/http';
import { Discount, Dispenser, Hose, Sale } from '../domain/models';
import { SalesApi } from '../domain/repository';

export const salesApi: SalesApi = {
  // Dispensadores
  listDispensersKey: (q = '', branchId?: number, page = 1) =>
    `/dispensadores?q=${encodeURIComponent(q)}${branchId ? `&sucursalId=${branchId}` : ''}&page=${page}&pageSize=10`,
  getDispenser: (id: number) => send<Dispenser>(`/dispensadores/${id}`, 'GET'),
  createDispenser: (data: Partial<Dispenser>) => send<Dispenser>('/dispensadores', 'POST', data),
  updateDispenser: (id: number, data: Partial<Dispenser>) => send<Dispenser>(`/dispensadores/${id}`, 'PATCH', data),
  deleteDispenser: (id: number) => send<void>(`/dispensadores/${id}`, 'DELETE'),
  createHose: (dispenserId: number, data: Partial<Hose>) =>
    send<Hose>(`/dispensadores/${dispenserId}/mangueras`, 'POST', data),
  updateHose: (dispenserId: number, hoseId: number, data: Partial<Hose>) =>
    send<Hose>(`/dispensadores/${dispenserId}/mangueras/${hoseId}`, 'PATCH', data),
  deleteHose: (dispenserId: number, hoseId: number) =>
    send<void>(`/dispensadores/${dispenserId}/mangueras/${hoseId}`, 'DELETE'),

  // Descuentos
  listDiscountsKey: (q = '', branchId?: number, page = 1) =>
    `/descuentos?q=${encodeURIComponent(q)}${branchId ? `&sucursalId=${branchId}` : ''}&page=${page}&pageSize=10`,
  listActiveDiscounts: (branchId?: number) =>
    send<Discount[]>(`/descuentos/activos${branchId ? `?sucursalId=${branchId}` : ''}`, 'GET'),
  getDiscount: (id: number) => send<Discount>(`/descuentos/${id}`, 'GET'),
  createDiscount: (data: Partial<Discount>) => send<Discount>('/descuentos', 'POST', data),
  updateDiscount: (id: number, data: Partial<Discount>) => send<Discount>(`/descuentos/${id}`, 'PATCH', data),
  toggleDiscountStatus: (id: number) => send<Discount>(`/descuentos/${id}/estado`, 'PATCH'),
  deleteDiscount: (id: number) => send<void>(`/descuentos/${id}`, 'DELETE'),

  // Ventas
  listSalesKey: (q = '', branchId?: number, page = 1) =>
    `/ventas?q=${encodeURIComponent(q)}${branchId ? `&sucursalId=${branchId}` : ''}&page=${page}&pageSize=10`,
  getSale: (id: number) => send<Sale>(`/ventas/${id}`, 'GET'),
  createSale: (data: any) => send<Sale>('/ventas', 'POST', data),
  annulSale: (id: number) => send<Sale>(`/ventas/${id}/anular`, 'POST'),
  listCustomersKey: (q = '', page = 1) =>
    `/ventas/clientes?q=${encodeURIComponent(q)}&page=${page}&pageSize=10`,
};
