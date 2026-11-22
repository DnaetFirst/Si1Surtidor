export interface CreateSaleItemCommand {
  idProducto?: number;
  idManguera?: number;
  idDescuento?: number;
  cantidad: number;
  precio: number;
}

export interface CreateSaleCommand {
  codigo?: string;
  nombreCliente?: string;
  nit?: string;
  placa?: string;
  metodoPago: string;
  montoPagado: number;
  estadoBSisa?: boolean;
  idDispensador?: number;
  idSucursal: number;
  detalles: CreateSaleItemCommand[];
}
