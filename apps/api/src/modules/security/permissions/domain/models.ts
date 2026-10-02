export interface PermissionRecord {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    modulo: string;
    accion: string;
    reservado: boolean;
    activo: boolean;
    createdAt: Date;
}
