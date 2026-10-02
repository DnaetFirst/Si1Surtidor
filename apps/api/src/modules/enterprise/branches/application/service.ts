import { Injectable } from '@nestjs/common';
import { BranchesRepository } from '../domain/repository';
@Injectable()
export class BranchesService {
    constructor(private readonly repository: BranchesRepository) { }
    branches() { return this.repository.branches(); }
}
