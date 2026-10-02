import { BranchRecord } from './models';
export abstract class BranchesRepository {
    abstract branches(): Promise<BranchRecord[]>;
}
