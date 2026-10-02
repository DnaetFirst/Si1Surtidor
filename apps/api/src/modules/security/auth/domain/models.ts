export interface IdentityRecord {
    ci: string;
    nombre: string;
    correo: string;
    rolId: number;
    rolCodigo: string;
    rolNombre: string;
}
export interface LoginRecord {
    ci: string;
    nombre: string;
    password_hash: string;
    bloqueado_hasta: Date | null;
    intentos_fallidos: number;
}
export interface SessionRecord {
    id: string;
    ci_usuario: string;
    refresh_hash: string;
    expires_at: Date;
    nombre: string;
}
