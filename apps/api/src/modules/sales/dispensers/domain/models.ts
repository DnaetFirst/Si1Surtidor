export interface HoseRecord {
  id: number;
  nombre: string;
  numero?: number;
  lado?: string;
  color?: string;
  estaActivo: boolean;
  estado: string;
  idDispensador: number;
  idCombustible: number;
  combustibleNombre?: string;
  combustibleTipo?: string;
}

export interface DispenserRecord {
  id: number;
  ubicacion: string;
  capacidadMaxima: number;
  estaActivo: boolean;
  estado: string;
  idSucursal: number;
  sucursalNombre?: string;
  createdAt: string;
  updatedAt: string;
  mangueras?: HoseRecord[];
}

// Alias para diagrama de clases, comunicación y análisis (CU7)
export type Dispensador = DispenserRecord;
export type Manguera = HoseRecord;
