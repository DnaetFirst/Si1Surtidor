import { Role } from './models';
export interface RolesApi {
    disable(target: Role): Promise<unknown>;
    listKey(page: number, search: string, active: string): string | null;
    detailKey(id: string | undefined): string | null;
    assignablePermissionsKey(): string | null;
    save(id: string | undefined, nombre: string, selected: number[]): Promise<unknown>;
}
