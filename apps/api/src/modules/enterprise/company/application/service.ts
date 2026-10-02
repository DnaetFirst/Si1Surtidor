import { Injectable } from '@nestjs/common';
import { AdministrativeTransaction, AuthRequest, TransactionContext } from '../../../../shared/domain/context';
import { ConflictException, NotFoundException } from '../../../../shared/domain/errors';
import { CompanyDto, UpdateCompanyDto } from '../domain/commands';
import { CompanyRepository } from '../domain/repository';
@Injectable()
export class CompanyService {
    constructor(private readonly repository: CompanyRepository, private readonly transactions: AdministrativeTransaction) { }
    company(tx?: TransactionContext) { return this.repository.company(tx); }
    async createCompany(dto: CompanyDto, req: AuthRequest) {
        return this.transactions.mutation(req, 'empresa.crear', 'empresa', async (tx) => {
            if (await this.repository.company(tx))
                throw new ConflictException('La empresa ya está registrada. Puede modificarla.');
            await this.repository.insert(dto, tx);
            return this.repository.company(tx);
        });
    }
    async updateCompany(dto: UpdateCompanyDto, req: AuthRequest) {
        return this.transactions.mutation(req, 'empresa.editar', 'empresa', async (tx) => {
            if (!await this.repository.company(tx))
                throw new NotFoundException('Primero registre la empresa.');
            await this.repository.update(dto, tx);
            return this.repository.company(tx);
        });
    }
}
