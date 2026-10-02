export interface UserRecord {
    ci: string;
    nombre: string;
    correo: string;
    telefono: string;
    cargo: string | null;
    sexo: string;
    domicilio: string;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    rolId: number;
    sucursalId: number | null;
    rol: {
        id: number;
        codigo: string;
        nombre: string;
    };
    sucursal: {
        id: number;
        nombre: string;
    } | null;
}
