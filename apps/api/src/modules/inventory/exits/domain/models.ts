export interface ProductExitRecord {
  id: number;
  motivo: string;
  cantidad: number;
  fecha: Date;
  idLote: number | null;
  loteCodigo?: string | null;
  idProducto: number;
  productoNombre?: string;
  productoCodigo?: string;
  idSucursal?: number | null;
  sucursalNombre?: string | null;
}
