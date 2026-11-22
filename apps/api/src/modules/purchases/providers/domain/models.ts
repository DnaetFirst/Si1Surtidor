export interface ProviderProductRecord {
  id: number;
  detalle: string;
  ultimoPrecio: number;
  idProveedor: number;
  idProducto: number;
  productoNombre?: string;
  activo: boolean;
  createdAt: string;
}

export interface ProviderRecord {
  id: number;
  nombre: string;
  razonSocial?: string;
  nit: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  detalle: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  productos?: ProviderProductRecord[];
}
