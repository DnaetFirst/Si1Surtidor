export interface CreateHoseCommand {
  nombre?: string;
  numero?: number;
  lado?: string;
  color?: string;
  idCombustible: number;
  estaActivo?: boolean;
  estado?: string;
}

export interface CreateDispenserCommand {
  ubicacion: string;
  capacidadMaxima: number;
  idSucursal: number;
  estaActivo?: boolean;
  estado?: string;
  mangueras?: CreateHoseCommand[];
}

export interface UpdateDispenserCommand {
  ubicacion?: string;
  capacidadMaxima?: number;
  idSucursal?: number;
  estaActivo?: boolean;
  estado?: string;
}

export interface UpdateHoseCommand {
  nombre?: string;
  numero?: number;
  lado?: string;
  color?: string;
  idCombustible?: number;
  estaActivo?: boolean;
  estado?: string;
}
