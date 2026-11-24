import { Discount, Dispenser, Hose, Sale } from './models';

export interface SalesApi {
  // Dispensadores
  listDispensersKey: (q?: string, branchId?: number, page?: number) => string;
  getDispenser: (id: number) => Promise<Dispenser>;
  createDispenser: (data: Partial<Dispenser>) => Promise<Dispenser>;
  updateDispenser: (id: number, data: Partial<Dispenser>) => Promise<Dispenser>;
  deleteDispenser: (id: number) => Promise<void>;
  createHose: (dispenserId: number, data: Partial<Hose>) => Promise<Hose>;
  updateHose: (dispenserId: number, hoseId: number, data: Partial<Hose>) => Promise<Hose>;
  deleteHose: (dispenserId: number, hoseId: number) => Promise<void>;

  // Descuentos
  listDiscountsKey: (q?: string, branchId?: number, page?: number) => string;
  listActiveDiscounts: (branchId?: number) => Promise<Discount[]>;
  getDiscount: (id: number) => Promise<Discount>;
  createDiscount: (data: Partial<Discount>) => Promise<Discount>;
  updateDiscount: (id: number, data: Partial<Discount>) => Promise<Discount>;
  toggleDiscountStatus: (id: number) => Promise<Discount>;
  deleteDiscount: (id: number) => Promise<void>;

  // Ventas
  listSalesKey: (q?: string, branchId?: number, page?: number) => string;
  getSale: (id: number) => Promise<Sale>;
  createSale: (data: any) => Promise<Sale>;
  annulSale: (id: number) => Promise<Sale>;
  listCustomersKey: (q?: string, page?: number) => string;
}
