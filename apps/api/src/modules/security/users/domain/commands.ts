export interface CreateUserDto {
    ci: string;
    nombre: string;
    correo: string;
    telefono: string;
    cargo?: string;
    sexo: string;
    domicilio: string;
    contrasena: string;
    rolId: number;
    sucursalId?: number | null;
}
export interface UpdateUserDto extends Partial<CreateUserDto> {
    contrasena?: string;
}
