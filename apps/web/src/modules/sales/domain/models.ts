export interface Hose {
  id: number;
  nombre: string;
  estaActivo: boolean;
  estado: string;
  idDispensador: number;
  idCombustible: number;
  combustibleNombre?: string;
  combustibleTipo?: string;
}

export interface Dispenser {
  id: number;
  ubicacion: string;
  capacidadMaxima: number;
  estaActivo: boolean;
  estado: string;
  idSucursal: number;
  sucursalNombre?: string;
  mangueras?: Hose[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Discount {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: number;
  monto: number;
  porcentaje: number;
  activo: boolean;
  estaActivo: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idSucursal?: number | null;
  sucursalNombre?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  nombre: string;
  nit: string;
  placa: string;
  cantidadMensualVendida: number;
  ultimaFecha?: string | null;
  idSucursal?: number | null;
  createdAt?: string;
}

export interface SaleDetail {
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

export interface Sale {
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
  estado?: string;
  estadoBSisa: boolean;
  ciUsuario: string;
  usuarioNombre?: string;
  idDispensador?: number | null;
  dispensadorUbicacion?: string | null;
  idSucursal: number;
  sucursalNombre?: string;
  idCliente?: number | null;
  detalles?: SaleDetail[];
  totalVenta?: number;
  createdAt?: string;
}

// Alias para diagrama de clases, comunicación y análisis (CU7, CU11, CU12)
export type Dispensador = Dispenser;
export type Manguera = Hose;
export type Descuento = Discount;
export type Venta = Sale;
export type DetalleVenta = SaleDetail;
export type Cliente = Customer;
