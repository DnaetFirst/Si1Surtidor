import { Category, Fuel, Group, Product } from './models';

export interface InventoryApi {
  listProductsKey(): string;
  createProduct(data: Partial<Product>): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  listFuelsKey(): string;
  createFuel(data: Partial<Fuel>): Promise<Fuel>;
  updateFuel(id: number, data: Partial<Fuel>): Promise<Fuel>;
  deleteFuel(id: number): Promise<void>;

  listCategoriesKey(): string;
  createCategory(data: Partial<Category>): Promise<Category>;
  updateCategory(id: number, data: Partial<Category>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  listGroupsKey(): string;
  createGroup(data: Partial<Group>): Promise<Group>;
  updateGroup(id: number, data: Partial<Group>): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
}
