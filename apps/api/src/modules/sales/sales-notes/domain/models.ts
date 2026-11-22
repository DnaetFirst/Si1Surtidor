export interface CustomerRecord {
  id: number;
  nombre: string;
  nit: string;
  placa: string;
  cantidadMensualVendida: number;
  ultimaFecha?: string | null;
  idSucursal?: number | null;
  createdAt: Date;
}

export interface SaleDetailRecord {
  id: number;
  idNotaVenta: number;
  idProducto?: number | null;
  productoNombre?: string | null;
  idManguera?: number | null;
  mangueraNombre?: string | null;
  combustibleNombre?: string | null;
  idDescuento?: number | null;
  descuentoNombre?: string | null;
  descuentoMonto?: number | null;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface SaleRecord {
  id: number;
  codigo: string;
  nombreCliente: string;
  nit: string;
  placa: string;
  metodoPago: string;
  montoPagado: number;
  montoPorCobrar: number;
  montoCambio: number;
  fecha: string;
  hora: string;
  estadoBSisa: boolean;
  ciUsuario: string;
  usuarioNombre?: string;
  idDispensador?: number | null;
  dispensadorUbicacion?: string | null;
  idSucursal: number;
  sucursalNombre?: string;
  idCliente?: number | null;
  detalles?: SaleDetailRecord[];
  totalVenta?: number;
  createdAt: Date;
}
