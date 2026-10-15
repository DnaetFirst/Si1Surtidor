export interface CreateCategoryCommand {
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  activo?: boolean;
}

export interface UpdateCategoryCommand {
  nombre?: string;
  descripcion?: string;
  imagenUrl?: string;
  activo?: boolean;
}

export interface CreateGroupCommand {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateGroupCommand {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
