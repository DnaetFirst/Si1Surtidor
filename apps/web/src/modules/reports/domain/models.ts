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

export interface DailySales {
  fecha: string;
  transacciones: number;
  totalVendido: number;
  totalCombustible: number;
  totalTienda: number;
}

export interface SaleItemRow {
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
}

export interface DispenserSale {
  dispensador: string;
  manguera: string;
  combustible: string;
  sucursal: string;
  despachos: number;
  litrosTotales: number;
  montoTotalBs: number;
}

export interface ProviderPurchase {
  proveedor: string;
  proveedorNit: string;
  totalCompras: number;
  montoTotalBs: number;
}

export interface InventoryStatus {
  id: number;
  codigo: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  precioVenta: number;
  unidad: string;
  categoria: string;
  sucursal: string;
  estadoStock: 'AGOTADO' | 'STOCK CRÍTICO' | 'BAJO' | 'ÓPTIMO';
  valoracionEstimada: number;
}

export interface ExitSummary {
  motivo: string;
  registros: number;
  cantidadTotalBaja: number;
  producto: string;
  sucursal: string;
}

export interface TopCustomer {
  id: number;
  nombre: string;
  nit: string;
  placa: string;
  totalVentas: number;
  ultimaCompra?: string;
  sucursal?: string;
}

export type ReportTabType =
  | 'resumen'
  | 'ventas'
  | 'dispensadores'
  | 'compras'
  | 'inventario'
  | 'salidas'
  | 'clientes';

export type ReportExportFormat = 'csv' | 'excel' | 'pdf';

export interface PredefinedVoiceCommand {
  id: string;
  etiqueta: string;
  fraseEjemplo: string;
  descripcion: string;
  tipo: ReportTabType;
  periodo: 'todo' | 'semana' | 'mes' | 'ano';
  formato?: ReportExportFormat;
  soloHoy?: boolean;
}

export interface ParsedVoiceIntent {
  matchedCommandId?: string;
  tipo: ReportTabType | 'sucursales';
  periodo: 'todo' | 'semana' | 'mes' | 'ano';
  desde?: string;
  hasta?: string;
  sucursalId?: number;
  sucursalNombre?: string;
  formato?: ReportExportFormat;
  preguntaIa: string;
}

export interface AiReportConsultPayload {
  prompt: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
  periodo?: string;
  sucursalId?: number;
  viaVoz?: boolean;
}

export interface AiReportResponse {
  resumenEjecutivo: string;
  hallazgos: string[];
  recomendaciones: string[];
  speechText: string;
  provider: 'gemini' | 'local-fallback' | 'local-data';
  model: string;
  notaConfiguracion?: string;
  intent: ParsedVoiceIntent;
  datasetTitle: string;
  datasetSubtitle: string;
  previewHeaders: string[];
  previewRows: (string | number | null | undefined)[][];
  totals: string[];
}
