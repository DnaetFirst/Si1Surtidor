import {
  DailySales,
  DispenserSale,
  ExitSummary,
  InventoryStatus,
  ProviderPurchase,
  SaleItemRow,
  TopCustomer,
} from './models';

export interface ReportsApi {
  getSummaryKey(branchId?: number): string;
  getSalesReport(from?: string, to?: string, branchId?: number): Promise<{ daily: DailySales[]; items: SaleItemRow[] }>;
  getDispensersReport(from?: string, to?: string, branchId?: number): Promise<DispenserSale[]>;
  getPurchasesReport(from?: string, to?: string, branchId?: number): Promise<ProviderPurchase[]>;
  getInventoryReport(branchId?: number): Promise<InventoryStatus[]>;
  getExitsReport(from?: string, to?: string, branchId?: number): Promise<ExitSummary[]>;
  getCustomersReport(limit?: number): Promise<TopCustomer[]>;
  exportCsvUrl(type: string, from?: string, to?: string, branchId?: number): string;
}
