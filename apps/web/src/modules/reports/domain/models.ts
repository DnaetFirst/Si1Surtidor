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
