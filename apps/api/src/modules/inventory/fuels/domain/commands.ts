export interface CreateFuelCommand {
  tipo: string;
  octanaje: number;
  nombre: string;
  descripcion?: string;
  estaActivo?: boolean;
}

export interface UpdateFuelCommand {
  tipo?: string;
  octanaje?: number;
  nombre?: string;
  descripcion?: string;
  estaActivo?: boolean;
}
