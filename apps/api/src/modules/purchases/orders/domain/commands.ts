export interface CreatePurchaseOrderItemCommand {
  idProducto: number;
  cantidad: number;
}

export interface CreatePurchaseOrderCommand {
  codigo?: string;
  motivo?: string;
  idProveedor?: number;
  idSucursal: number;
  detalles: CreatePurchaseOrderItemCommand[];
}

export interface UpdatePurchaseOrderStatusCommand {
  estado: 'PENDIENTE' | 'APROBADA' | 'RECIBIDA' | 'ANULADA';
  motivo?: string;
}
