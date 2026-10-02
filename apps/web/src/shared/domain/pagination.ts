export interface PageData<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
