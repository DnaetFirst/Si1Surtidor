export interface AuditEvent {
    id: number;
    usuarioCi: string | null;
    usuarioNombre: string | null;
    identidad: string | null;
    accion: string;
    resultado: string;
    fecha: string;
    ip: string;
    endpoint: string;
    entidad: string | null;
    archivadoAt: string | null;
}
