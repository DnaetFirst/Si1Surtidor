export type ReportPeriod = 'semana' | 'mes' | 'ano' | 'año' | 'todo';

export interface ReportFilter {
  desde?: string;
  hasta?: string;
  periodo?: string;
  sucursalId?: number;
}

export interface DashboardSummary {
  ventasHoy: number;
  ventasMes: number;
  transaccionesHoy: number;
  litrosDespachadosHoy: number;
  alertasStockBajo: number;
  dispensadoresActivos: number;
  ultimasVentas: {
    id: number;
    codigo: string;
    nombreCliente: string;
    placa: string;
    total: number;
    metodoPago: string;
    fecha: string;
    hora: string;
    sucursalNombre: string;
  }[];
  ventasPorCombustible: { combustible: string; totalLitros: number; totalBs: number }[];
}

export interface SalesReportResult {
  daily: {
    fecha: string;
    transacciones: number;
    totalVendido: number;
    totalCombustible: number;
    totalTienda: number;
  }[];
  items: {
    id: number;
    codigo: string;
    fecha: string;
    hora: string;
    cliente: string;
    nit: string;
    placa: string;
    metodoPago: string;
    total: number;
    sucursal: string;
    cajero: string;
  }[];
}

// Alias para diagrama de clases, comunicación y análisis (CU14)
export type ResumenDashboard = DashboardSummary;
export type ReporteVentas = SalesReportResult;
