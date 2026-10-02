import { Capability, Permission } from './models';
export interface PermissionsApi {
    disable(target: Permission): Promise<unknown>;
    listKey(params: string, page: number): string | null;
    exportCsv(params: string): Promise<void>;
    detailKey(id: string | undefined): string | null;
    capabilitiesKey(id: string | undefined): string | null;
    save(id: string | undefined, form: Record<string, string>, capability: Capability | undefined): Promise<unknown>;
}
