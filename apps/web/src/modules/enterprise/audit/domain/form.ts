export type Filters = {
    usuario: string;
    accion: string;
    desde: string;
    hasta: string;
};
export const noFilters: Filters = { usuario: '', accion: '', desde: '', hasta: '' };
export const beginning = (day: string) => day ? `${day}T00:00:00.000-04:00` : undefined;
export const end = (day: string) => day ? `${day}T23:59:59.999-04:00` : undefined;
