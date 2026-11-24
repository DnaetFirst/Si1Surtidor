export interface PurchaseReceiptDetailRecord {
  id: number;
  idNotaCompra: number;
  idProducto: number;
  productoNombre?: string;
  productoCodigo?: string;
  productoUnidadMedida?: string;
  idLote?: number | null;
  loteCodigo?: string | null;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface PurchaseReceiptRecord {
  id: number;
  codigo: string;
  motivo: string;
  estado?: string;
  montoTotal: number;
  moneda: string;
  fecha: string;
  hora: string;
  idProveedor: number | null;
  proveedorNombre?: string | null;
  proveedorNit?: string | null;
  idSucursal: number | null;
  sucursalNombre?: string | null;
  idOrden: number | null;
  ordenCodigo?: string | null;
  ciUsuario: string;
  usuarioNombre?: string;
  detalles?: PurchaseReceiptDetailRecord[];
  createdAt: Date;
}

export interface BatchRecord {
  id: number;
  codigo: string;
  codigoLote?: string;
  fechaVencimiento?: string | null;
  detalle: string;
  stock: number;
  stockInicial: number;
  estaActivo: boolean;
  idProducto: number;
  productoNombre?: string;
  idProveedorProducto?: number | null;
  createdAt: Date;
}

// Alias para diagrama de clases, comunicación y análisis (CU10)
export type Compra = PurchaseReceiptRecord;
export type NotaCompra = PurchaseReceiptRecord;
export type DetalleCompra = PurchaseReceiptDetailRecord;
export type Lote = BatchRecord;
