export interface CreateProductCommand {
  nombre: string;
  stock?: number;
  stockMinimo?: number;
  descripcion?: string;
  precioVenta: number | string;
  precioCompra?: number | string;
  iva?: number | string;
  urlImage?: string;
  estaActivo?: boolean;
  descuento?: number | string;
  idCategoria: number;
  idSucursal?: number;
  grupos?: number[];
}

export interface UpdateProductCommand {
  nombre?: string;
  stock?: number;
  stockMinimo?: number;
  descripcion?: string;
  precioVenta?: number | string;
  precioCompra?: number | string;
  iva?: number | string;
  urlImage?: string;
  estaActivo?: boolean;
  descuento?: number | string;
  idCategoria?: number;
  idSucursal?: number;
  grupos?: number[];
}
