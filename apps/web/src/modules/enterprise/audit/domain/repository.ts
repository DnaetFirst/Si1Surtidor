export interface AuditApi {
    listKey(params: string, page: number): string | null;
    exportCsv(params: string, archived: boolean): Promise<void>;
    archive(desde: string, hasta: string): Promise<{
        total: number;
        mensaje: string;
    }>;
}
