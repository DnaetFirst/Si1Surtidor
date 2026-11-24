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
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idSucursal?: number | null;
  sucursalNombre?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Alias para diagrama de clases, comunicación y análisis (CU12)
export type Descuento = DiscountRecord;
export type Discount = DiscountRecord;
