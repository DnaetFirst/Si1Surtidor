import { TransactionContext } from '../../../../shared/domain/context';
import { CompanyDto, UpdateCompanyDto } from './commands';
import { CompanyRecord } from './models';
export abstract class CompanyRepository {
    abstract company(tx?: TransactionContext): Promise<CompanyRecord | null>;
    abstract insert(dto: CompanyDto, tx?: TransactionContext): Promise<unknown[]>;
    abstract update(dto: UpdateCompanyDto, tx?: TransactionContext): Promise<unknown[]>;
}
