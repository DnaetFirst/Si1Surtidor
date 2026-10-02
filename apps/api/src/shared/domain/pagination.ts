export interface ListQuery {
    page: number;
    pageSize: number;
    q?: string;
    activo: string;
}
export interface PageResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
