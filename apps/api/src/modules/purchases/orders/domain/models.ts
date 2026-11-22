export interface PurchaseOrderDetailRecord {
  id: number;
  idOrdenCompra: number;
  idProducto: number;
  productoNombre?: string;
  productoCodigo?: string;
  productoUnidadMedida?: string;
  cantidad: number;
}

export interface PurchaseOrderRecord {
  id: number;
  codigo: string;
  cantidad: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECIBIDA' | 'ANULADA';
  idProveedor: number | null;
  proveedorNombre?: string | null;
  proveedorNit?: string | null;
  idSucursal: number;
  sucursalNombre?: string;
  ciUsuario: string;
  usuarioNombre?: string;
  detalles?: PurchaseOrderDetailRecord[];
  createdAt: Date;
  updatedAt: Date;
}
