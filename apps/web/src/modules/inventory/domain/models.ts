export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Fuel {
  id: number;
  tipo: string;
  octanaje: number;
  nombre: string;
  descripcion: string;
  estaActivo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  descripcion: string;
  precioVenta: string | number;
  precioCompra: string | number;
  iva: string | number;
  urlImage: string;
  estaActivo: boolean;
  descuento: string | number;
  idCategoria: number;
  categoriaNombre?: string;
  idSucursal: number;
  sucursalNombre?: string;
  grupos?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductExit {
  id: number;
  motivo: string;
  cantidad: number;
  fecha: string;
  idLote: number | null;
  loteCodigo?: string | null;
  idProducto: number;
  productoNombre?: string;
  productoCodigo?: string;
  idSucursal?: number | null;
  sucursalNombre?: string | null;
  usuarioNombre?: string;
}

export interface ProductNotification {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  resuelta: boolean;
  idProducto: number;
  productoNombre?: string;
  productoStock?: number;
  productoStockMinimo?: number;
  visto?: boolean;
}
