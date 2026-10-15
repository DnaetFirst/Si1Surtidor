export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
