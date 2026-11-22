export interface ProductNotificationRecord {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: Date;
  resuelta: boolean;
  idProducto: number;
  productoNombre?: string;
  productoStock?: number;
  productoStockMinimo?: number;
  visto?: boolean;
}
