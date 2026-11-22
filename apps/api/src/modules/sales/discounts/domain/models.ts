export interface DiscountRecord {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: number;
  monto: number;
  porcentaje: number;
  activo: boolean;
  estaActivo: boolean;
  idSucursal?: number | null;
  sucursalNombre?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
