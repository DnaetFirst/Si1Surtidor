import { send } from '../../../shared/infrastructure/http';
import {
  DailySales,
  DispenserSale,
  ExitSummary,
  InventoryStatus,
  ProviderPurchase,
  SaleItemRow,
  TopCustomer,
} from '../domain/models';
import { ReportsApi } from '../domain/repository';

export const reportsApi: ReportsApi = {
  getSummaryKey: (branchId?: number) => `/reportes/resumen${branchId ? `?sucursalId=${branchId}` : ''}`,

  getSalesReport: (from = '', to = '', branchId?: number) => {
    let url = '/reportes/ventas?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    return send<{ daily: DailySales[]; items: SaleItemRow[] }>(url, 'GET');
  },

  getDispensersReport: (from = '', to = '', branchId?: number) => {
    let url = '/reportes/dispensadores?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    return send<DispenserSale[]>(url, 'GET');
  },

  getPurchasesReport: (from = '', to = '', branchId?: number) => {
    let url = '/reportes/compras?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    return send<ProviderPurchase[]>(url, 'GET');
  },

  getInventoryReport: (branchId?: number) => {
    const url = `/reportes/inventario${branchId ? `?sucursalId=${branchId}` : ''}`;
    return send<InventoryStatus[]>(url, 'GET');
  },

  getExitsReport: (from = '', to = '', branchId?: number) => {
    let url = '/reportes/salidas?';
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    return send<ExitSummary[]>(url, 'GET');
  },

  getCustomersReport: (limit = 10) => send<TopCustomer[]>(`/reportes/clientes?limite=${limit}`, 'GET'),

  exportCsvUrl: (type: string, from?: string, to?: string, branchId?: number) => {
    let url = `/api/reportes/exportar-csv?tipo=${type}&`;
    if (from) url += `desde=${from}&`;
    if (to) url += `hasta=${to}&`;
    if (branchId) url += `sucursalId=${branchId}&`;
    return url;
  },
};
