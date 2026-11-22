export interface CreatePurchaseReceiptItemCommand {
  idProducto: number;
  cantidad: number;
  precio: number;
  loteCodigo?: string;
  fechaVencimiento?: string;
  loteDetalle?: string;
}

export interface CreatePurchaseReceiptCommand {
  codigo?: string;
  motivo?: string;
  moneda?: string;
  idProveedor?: number;
  idSucursal?: number;
  idOrden?: number;
  detalles: CreatePurchaseReceiptItemCommand[];
}
