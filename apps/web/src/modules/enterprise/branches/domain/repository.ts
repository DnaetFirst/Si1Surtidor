import { BranchDetail, BranchFormData } from './models';
export interface BranchesApi {
    listKey(page: number, q: string, activo: string): string;
    detailKey(id?: string): string | null;
    save(id: string | undefined, data: BranchFormData): Promise<BranchDetail>;
    disable(id: number): Promise<BranchDetail>;
}
