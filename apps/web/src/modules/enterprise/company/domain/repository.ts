import { Company } from './models';
export interface CompanyApi {
    detailKey(): string | null;
    save(data: Company | null | undefined, form: Company): Promise<Company>;
}
