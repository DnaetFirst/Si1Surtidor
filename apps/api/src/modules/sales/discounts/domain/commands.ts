export interface CreateDiscountCommand {
  nombre: string;
  descripcion?: string;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: number;
  activo?: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idSucursal?: number;
}

export interface UpdateDiscountCommand {
  nombre?: string;
  descripcion?: string;
  tipo?: 'PORCENTAJE' | 'MONTO_FIJO';
  valor?: number;
  activo?: boolean;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idSucursal?: number;
}
