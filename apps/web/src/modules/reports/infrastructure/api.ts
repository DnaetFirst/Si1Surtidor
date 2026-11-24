import { send } from '../../../shared/infrastructure/http';
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
} from '../domain/models';
import { ReportsApi } from '../domain/repository';

export const reportsApi: ReportsApi = {
  getSummaryKey: (branchId?: number) => `/reportes/resumen${branchId ? `?sucursalId=${branchId}` : ''}`,

  getSalesReport: (from = '', to = '', branchId?: number, periodo = '') => {
    let url = '/reportes/ventas?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    if (periodo && periodo !== 'todo') url += `periodo=${periodo}&`;
    return send<{ daily: DailySales[]; items: SaleItemRow[] }>(url, 'GET');
  },

  getDispensersReport: (from = '', to = '', branchId?: number, periodo = '') => {
    let url = '/reportes/dispensadores?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    if (periodo && periodo !== 'todo') url += `periodo=${periodo}&`;
    return send<DispenserSale[]>(url, 'GET');
  },

  getPurchasesReport: (from = '', to = '', branchId?: number, periodo = '') => {
    let url = '/reportes/compras?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    if (periodo && periodo !== 'todo') url += `periodo=${periodo}&`;
    return send<ProviderPurchase[]>(url, 'GET');
  },

  getInventoryReport: (branchId?: number) => {
    const url = `/reportes/inventario${branchId ? `?sucursalId=${branchId}` : ''}`;
    return send<InventoryStatus[]>(url, 'GET');
  },

  getExitsReport: (from = '', to = '', branchId?: number, periodo = '') => {
    let url = '/reportes/salidas?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    if (periodo && periodo !== 'todo') url += `periodo=${periodo}&`;
    return send<ExitSummary[]>(url, 'GET');
  },

  getCustomersReport: (limit = 10) => send<TopCustomer[]>(`/reportes/clientes?limite=${limit}`, 'GET'),

  exportCsvUrl: (type: string, from?: string, to?: string, branchId?: number, periodo?: string) => {
    let url = `/api/reportes/exportar-csv?tipo=${type}&`;
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    if (periodo && periodo !== 'todo') url += `periodo=${periodo}&`;
    return url;
  },

  exportExcelUrl: (type: string, from?: string, to?: string, branchId?: number, periodo?: string) => {
    let url = `/api/reportes/exportar-excel?tipo=${type}&`;
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    if (periodo && periodo !== 'todo') url += `periodo=${periodo}&`;
    return url;
  },

  exportPdfUrl: (type: string, from?: string, to?: string, branchId?: number, periodo?: string) => {
    let url = `/api/reportes/exportar-pdf?tipo=${type}&`;
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    if (periodo && periodo !== 'todo') url += `periodo=${periodo}&`;
    return url;
  },

  getVoiceCommands: () => send<PredefinedVoiceCommand[]>('/reportes/voz/comandos', 'GET'),

  transcribeVoice: (data: string, mimeType: string) =>
    send<{ transcript: string }>('/reportes/voz/transcribir', 'POST', { data, mimeType }),
  consultWithAi: (payload: AiReportConsultPayload) => send<AiReportResponse>('/reportes/ia/consultar', 'POST', payload),
};
