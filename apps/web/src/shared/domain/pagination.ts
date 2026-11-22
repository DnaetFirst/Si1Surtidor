export interface PageData<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

export type PageResult<T> = PageData<T>;
