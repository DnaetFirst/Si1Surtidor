export interface CompanyRecord {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
    correo: string;
    nombrePropietario: string;
    fechaCreacion: string;
    logoUrl: string | null;
    nit: string;
    createdAt: Date;
    updatedAt: Date;
}
