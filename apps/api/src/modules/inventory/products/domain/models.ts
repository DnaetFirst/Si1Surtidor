export interface Product {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  descripcion: string;
  precioVenta: string;
  precioCompra: string;
  iva: string;
  urlImage: string;
  estaActivo: boolean;
  descuento: string;
  idCategoria: number;
  categoriaNombre?: string;
  idSucursal: number;
  sucursalNombre?: string;
  grupos?: number[];
  createdAt: string;
  updatedAt: string;
}
