export interface RoleDto {
    nombre: string;
    permisoIds: number[];
}
export interface UpdateRoleDto extends Partial<RoleDto> {
}
