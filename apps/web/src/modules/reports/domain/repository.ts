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
  getSalesReport(from?: string, to?: string, branchId?: number, periodo?: string): Promise<{ daily: DailySales[]; items: SaleItemRow[] }>;
  getDispensersReport(from?: string, to?: string, branchId?: number, periodo?: string): Promise<DispenserSale[]>;
  getPurchasesReport(from?: string, to?: string, branchId?: number, periodo?: string): Promise<ProviderPurchase[]>;
  getInventoryReport(branchId?: number): Promise<InventoryStatus[]>;
  getExitsReport(from?: string, to?: string, branchId?: number, periodo?: string): Promise<ExitSummary[]>;
  getCustomersReport(limit?: number): Promise<TopCustomer[]>;
  exportCsvUrl(type: string, from?: string, to?: string, branchId?: number, periodo?: string): string;
}
