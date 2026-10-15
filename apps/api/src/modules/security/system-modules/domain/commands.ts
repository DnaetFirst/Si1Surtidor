export interface CreateSystemModuleCommand {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateSystemModuleCommand {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
