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

// Alias para diagrama de clases, comunicación y análisis (CU18)
export type NotificacionProducto = ProductNotificationRecord;
export interface UsuarioNotificacion {
  id: number;
  visto: boolean;
  recordar: boolean;
  ciUsuario: string;
  idNotificacion: number;
}
