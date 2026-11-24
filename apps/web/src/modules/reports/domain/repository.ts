import { ParsedVoiceIntent, ReportExportFormat } from './models';
import {
  AiReportConsultPayload,
  AiReportResponse,
  DailySales,
  DispenserSale,
  ExitSummary,
  InventoryStatus,
  PredefinedVoiceCommand,
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
  exportExcelUrl(type: string, from?: string, to?: string, branchId?: number, periodo?: string): string;
  exportPdfUrl(type: string, from?: string, to?: string, branchId?: number, periodo?: string): string;
  downloadReport(format: ReportExportFormat, intent: ParsedVoiceIntent): Promise<void>;
  getVoiceCommands(): Promise<PredefinedVoiceCommand[]>;
  transcribeVoice(data: string, mimeType: string): Promise<{ transcript: string }>;
  consultWithAi(payload: AiReportConsultPayload): Promise<AiReportResponse>;
}
