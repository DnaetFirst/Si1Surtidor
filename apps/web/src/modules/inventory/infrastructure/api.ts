import { send } from '../../../shared/infrastructure/http';
import { Category, Fuel, Group, Product } from '../domain/models';
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
};
