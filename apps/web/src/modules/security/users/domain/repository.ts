import { User } from './models';
export interface UsersApi {
    disable(target: User): Promise<unknown>;
    listKey(page: number, search: string, active: string): string | null;
    detailKey(ci: string | undefined): string | null;
    roleOptionsKey(readonly: boolean): string | null;
    branchesKey(readonly: boolean): string | null;
    save(ci: string | undefined, payload: unknown): Promise<unknown>;
}
