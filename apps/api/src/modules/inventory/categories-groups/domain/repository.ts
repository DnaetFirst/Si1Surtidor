import { TransactionContext } from '../../../../shared/domain/context';
import { CreateCategoryCommand, CreateGroupCommand, UpdateCategoryCommand, UpdateGroupCommand } from './commands';
import { Category, Group } from './models';

export abstract class CategoryGroupRepository {
  abstract listCategories(tx?: TransactionContext): Promise<Category[]>;
  abstract findCategoryById(id: number, tx?: TransactionContext): Promise<Category | null>;
  abstract findCategoryByName(name: string, tx?: TransactionContext): Promise<Category | null>;
  abstract createCategory(data: CreateCategoryCommand, tx?: TransactionContext): Promise<Category>;
  abstract updateCategory(id: number, data: UpdateCategoryCommand, tx?: TransactionContext): Promise<Category>;
  abstract deleteCategory(id: number, tx?: TransactionContext): Promise<void>;
  abstract countProductsInCategory(categoryId: number, tx?: TransactionContext): Promise<number>;

  abstract listGroups(tx?: TransactionContext): Promise<Group[]>;
  abstract findGroupById(id: number, tx?: TransactionContext): Promise<Group | null>;
  abstract findGroupByName(name: string, tx?: TransactionContext): Promise<Group | null>;
  abstract createGroup(data: CreateGroupCommand, tx?: TransactionContext): Promise<Group>;
  abstract updateGroup(id: number, data: UpdateGroupCommand, tx?: TransactionContext): Promise<Group>;
  abstract deleteGroup(id: number, tx?: TransactionContext): Promise<void>;
  abstract countProductsInGroup(groupId: number, tx?: TransactionContext): Promise<number>;
}
