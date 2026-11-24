export interface ProductExitRecord {
  id: number;
  motivo: string;
  cantidad: number;
  fecha: Date;
  estado?: string;
  documentoOrigen?: string | null;
  referenciaReversion?: number | null;
  idLote: number | null;
  loteCodigo?: string | null;
  idProducto: number;
  productoNombre?: string;
  productoCodigo?: string;
  idSucursal?: number | null;
  sucursalNombre?: string | null;
}

// Alias para diagrama de clases, comunicación y análisis (CU19)
export type SalidaProducto = ProductExitRecord;
export type Salida_de_productos = ProductExitRecord;
