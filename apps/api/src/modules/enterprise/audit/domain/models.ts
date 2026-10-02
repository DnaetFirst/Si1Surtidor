export interface AuditRecord {
    id: string;
    usuarioCi: string | null;
    usuarioNombre: string | null;
    identidad: string | null;
    accion: string;
    resultado: string;
    fecha: Date;
    ip: string;
    endpoint: string;
    entidad: string | null;
    archivadoAt: Date | null;
}
