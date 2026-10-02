export interface PermissionDto {
    nombre: string;
    descripcion: string;
    modulo: string;
    accion: string;
}
export interface UpdatePermissionDto {
    nombre?: string;
    descripcion?: string;
}
