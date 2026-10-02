export interface CompanyDto {
    nombre: string;
    telefono: string;
    direccion: string;
    correo: string;
    nombrePropietario: string;
    fechaCreacion: string;
    logoUrl?: string | null;
    nit: string;
}
export interface UpdateCompanyDto extends Partial<CompanyDto> {
}
