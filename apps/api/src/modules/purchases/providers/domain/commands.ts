export interface LinkProductCommand {
  idProducto: number;
  ultimoPrecio: number;
  detalle?: string;
}

export interface CreateProviderCommand {
  nombre: string;
  razonSocial?: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  detalle?: string;
  productos?: LinkProductCommand[];
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
