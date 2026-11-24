export interface CreateProductExitCommand {
  motivo: string;
  cantidad: number;
  idProducto: number;
  idLote?: number;
  documentoOrigen?: string;
}
