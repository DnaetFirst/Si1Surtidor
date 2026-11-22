export interface Provider {
  id: number;
  nombre: string;
  razonSocial?: string | null;
  nit: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  detalle: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderProduct {
  id: number;
  idProveedor: number;
  idProducto: number;
  productoNombre?: string;
  productoCodigo?: string;
  productoDescripcion?: string;
  productoStock?: number;
  productoStockMinimo?: number;
  ultimoPrecio: number;
  detalle: string;
  activo: boolean;
}

export interface PurchaseOrderDetail {
  id: number;
  idOrdenCompra: number;
  idProducto: number;
  productoNombre?: string;
  productoCodigo?: string;
  productoUnidadMedida?: string;
  cantidad: number;
}

export interface PurchaseOrder {
  id: number;
  codigo: string;
  cantidad: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'PENDIENTE' | 'RECIBIDA' | 'ANULADA';
  idProveedor: number | null;
  proveedorNombre?: string | null;
  proveedorNit?: string | null;
  idSucursal: number;
  sucursalNombre?: string;
  ciUsuario: string;
  usuarioNombre?: string;
  detalles?: PurchaseOrderDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseReceiptDetail {
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

export interface PurchaseReceipt {
  id: number;
  codigo: string;
  motivo: string;
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
  detalles?: PurchaseReceiptDetail[];
  createdAt?: string;
}

export interface Batch {
  id: number;
  codigo: string;
  fechaVencimiento?: string | null;
  detalle: string;
  stock: number;
  stockInicial: number;
  estaActivo: boolean;
  idProducto: number;
  productoNombre?: string;
  idProveedorProducto?: number | null;
  createdAt?: string;
}
