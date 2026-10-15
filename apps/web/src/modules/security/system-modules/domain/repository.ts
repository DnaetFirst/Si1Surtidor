import { SystemModule } from './models';

export interface SystemModulesApi {
  listKey(): string;
  create(data: Partial<SystemModule>): Promise<SystemModule>;
  update(id: number, data: Partial<SystemModule>): Promise<SystemModule>;
  delete(id: number): Promise<void>;
}
