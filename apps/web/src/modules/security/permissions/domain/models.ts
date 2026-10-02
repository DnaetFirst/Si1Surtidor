export interface Permission {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    modulo: string;
    accion: string;
    reservado: boolean;
    activo: boolean;
    createdAt: string;
}
export interface Capability {
    modulo: string;
    accion: string;
    codigo: string;
    reservado: boolean;
}
