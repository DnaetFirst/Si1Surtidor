import { send } from '../../../shared/infrastructure/http';
import { Category, Fuel, Group, Product, ProductExit } from '../domain/models';
import { InventoryApi } from '../domain/repository';

export const inventoryApi: InventoryApi = {
  listProductsKey: () => '/productos',
  createProduct: (data: Partial<Product>) => send<Product>('/productos', 'POST', data),
  updateProduct: (id: number, data: Partial<Product>) => send<Product>(`/productos/${id}`, 'PATCH', data),
  deleteProduct: (id: number) => send<void>(`/productos/${id}`, 'DELETE'),

  listFuelsKey: () => '/combustibles',
  createFuel: (data: Partial<Fuel>) => send<Fuel>('/combustibles', 'POST', data),
  updateFuel: (id: number, data: Partial<Fuel>) => send<Fuel>(`/combustibles/${id}`, 'PATCH', data),
  deleteFuel: (id: number) => send<void>(`/combustibles/${id}`, 'DELETE'),

  listCategoriesKey: () => '/categorias',
  createCategory: (data: Partial<Category>) => send<Category>('/categorias', 'POST', data),
  updateCategory: (id: number, data: Partial<Category>) => send<Category>(`/categorias/${id}`, 'PATCH', data),
  deleteCategory: (id: number) => send<void>(`/categorias/${id}`, 'DELETE'),

  listGroupsKey: () => '/grupos',
  createGroup: (data: Partial<Group>) => send<Group>('/grupos', 'POST', data),
  updateGroup: (id: number, data: Partial<Group>) => send<Group>(`/grupos/${id}`, 'PATCH', data),
  deleteGroup: (id: number) => send<void>(`/grupos/${id}`, 'DELETE'),

  // Salidas
  listExitsKey: (q = '', branchId?: number, page = 1) =>
    `/inventario/salidas?q=${encodeURIComponent(q)}${branchId ? `&sucursalId=${branchId}` : ''}&page=${page}&pageSize=10`,
  createExit: (data) => send<ProductExit>('/inventario/salidas', 'POST', data),

  // Notificaciones
  listNotificationsKey: () => '/inventario/notificaciones?page=1&pageSize=20',
  getUnreadCount: () => send<{ noLeidas: number }>('/inventario/notificaciones/conteo-no-leidas', 'GET'),
  markNotificationAsRead: (id: number) => send<void>(`/inventario/notificaciones/${id}/leida`, 'POST'),
  resolveNotification: (id: number) => send<void>(`/inventario/notificaciones/${id}/resolver`, 'PATCH'),
};
