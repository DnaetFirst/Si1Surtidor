export interface CreateProviderCommand {
  nombre: string;
  razonSocial?: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  detalle?: string;
}

export interface UpdateProviderCommand {
  nombre?: string;
  razonSocial?: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  detalle?: string;
  activo?: boolean;
}

export interface LinkProductCommand {
  idProducto: number;
  ultimoPrecio: number;
  detalle?: string;
}
