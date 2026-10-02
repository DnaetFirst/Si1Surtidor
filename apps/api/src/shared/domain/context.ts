export interface SessionUser {
    ci: string;
    nombre: string;
    correo: string;
    rol: {
        id: number;
        codigo: string;
        nombre: string;
    };
    permisos: string[];
}
/** Opaque handle: only persistence adapters may unwrap it. */
export interface TransactionContext {
    readonly transactionId: symbol;
}
export interface RequestContext {
    ip?: string;
    method: string;
    path: string;
    originalUrl: string;
    socket?: {
        remoteAddress?: string;
    };
    cookies?: Record<string, string>;
}
export interface AuthRequest extends RequestContext {
    user: SessionUser;
    sessionId: string;
}
export abstract class UnitOfWork {
    abstract transaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
export abstract class AdministrativeTransaction {
    abstract mutation<T>(req: AuthRequest, action: string, entity: string, work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
export abstract class AuditWriter {
    abstract record(req: AuthRequest, action: string, entity: string, tx?: TransactionContext): Promise<void>;
    abstract authentication(req: RequestContext, action: string, result: string, row?: {
        ci: string;
        nombre: string;
    }, identity?: string, tx?: TransactionContext): Promise<void>;
}
