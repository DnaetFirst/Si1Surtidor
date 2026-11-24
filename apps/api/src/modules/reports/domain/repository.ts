import { DashboardSummary, SalesReportResult } from './models';

export abstract class ReportsRepository {
  abstract getDashboardSummary(branchId?: number): Promise<DashboardSummary>;
  abstract getSalesReport(from?: string, to?: string, branchId?: number): Promise<SalesReportResult>;
  abstract getDispenserSalesReport(from?: string, to?: string, branchId?: number): Promise<any[]>;
  abstract getPurchasesReport(from?: string, to?: string, branchId?: number): Promise<any[]>;
  abstract getInventoryStatusReport(branchId?: number): Promise<any[]>;
  abstract getExitsReport(from?: string, to?: string, branchId?: number): Promise<any[]>;
  abstract getTopCustomersReport(limit?: number): Promise<any[]>;
  abstract listBranchesForReport(): Promise<{ id: number; nombre: string; activo: boolean; telefono: string | null; direccion: string | null; correo: string | null }[]>;
  abstract listActiveBranches(): Promise<{ id: number; nombre: string }[]>;
}
