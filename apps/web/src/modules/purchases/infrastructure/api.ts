import { send } from '../../../shared/infrastructure/http';
import { Provider, ProviderProduct, PurchaseOrder, PurchaseReceipt } from '../domain/models';
import { PurchasesApi } from '../domain/repository';

export const purchasesApi: PurchasesApi = {
  // Proveedores
  listProvidersKey: (q = '', activo = 'true', page = 1) =>
    `/proveedores?q=${encodeURIComponent(q)}&activo=${activo}&page=${page}&pageSize=10`,
  getProvider: (id: number) => send<Provider>(`/proveedores/${id}`, 'GET'),
  createProvider: (data: Partial<Provider>) => send<Provider>('/proveedores', 'POST', data),
  updateProvider: (id: number, data: Partial<Provider>) => send<Provider>(`/proveedores/${id}`, 'PATCH', data),
  toggleProviderStatus: (id: number) => send<Provider>(`/proveedores/${id}/estado`, 'PATCH'),
  getProviderProducts: (id: number) => send<ProviderProduct[]>(`/proveedores/${id}/productos`, 'GET'),
  linkProviderProduct: (id: number, data) => send<ProviderProduct>(`/proveedores/${id}/productos`, 'POST', data),
  unlinkProviderProduct: (id: number, productId: number) => send<void>(`/proveedores/${id}/productos/${productId}`, 'DELETE'),

  // Órdenes de compra
  listOrdersKey: (q = '', branchId?: number, page = 1) =>
    `/ordenes-compra?q=${encodeURIComponent(q)}${branchId ? `&sucursalId=${branchId}` : ''}&page=${page}&pageSize=10`,
  getOrder: (id: number) => send<PurchaseOrder>(`/ordenes-compra/${id}`, 'GET'),
  createOrder: (data: any) => send<PurchaseOrder>('/ordenes-compra', 'POST', data),
  updateOrder: (id: number, data: any) => send<PurchaseOrder>(`/ordenes-compra/${id}`, 'PATCH', data),
  updateOrderStatus: (id: number, estado: string, motivo?: string) =>
    send<PurchaseOrder>(`/ordenes-compra/${id}/estado`, 'PATCH', { estado, motivo }),
  deleteOrder: (id: number) => send<PurchaseOrder>(`/ordenes-compra/${id}`, 'DELETE'),

  // Compras
  listPurchasesKey: (q = '', branchId?: number, page = 1) =>
    `/compras?q=${encodeURIComponent(q)}${branchId ? `&sucursalId=${branchId}` : ''}&page=${page}&pageSize=10`,
  getPurchase: (id: number) => send<PurchaseReceipt>(`/compras/${id}`, 'GET'),
  createPurchase: (data: any) => send<PurchaseReceipt>('/compras', 'POST', data),
  annulPurchase: (id: number) => send<PurchaseReceipt>(`/compras/${id}/anular`, 'POST'),
  listBatchesKey: (productId?: number, page = 1) =>
    `/compras/lotes?${productId ? `productoId=${productId}&` : ''}page=${page}&pageSize=10`,
};
