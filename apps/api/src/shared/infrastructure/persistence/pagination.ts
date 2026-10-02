import { DataSource, EntityManager } from 'typeorm';
import { ListQuery } from '../../domain/pagination';
type Db = DataSource | EntityManager;
export async function page(db: Db, select: string, from: string, where: string[], params: unknown[], query: ListQuery, order: string) {
    const predicate = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const [{ total }] = await db.query(`SELECT count(*)::int AS total FROM ${from}${predicate}`, params);
    const items = await db.query(`SELECT ${select} FROM ${from}${predicate} ORDER BY ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, query.pageSize, (query.page - 1) * query.pageSize]);
    return { items, total, page: query.page, pageSize: query.pageSize };
}
export function filters(query: ListQuery, alias = '') {
    const params: unknown[] = [];
    const where: string[] = [];
    if (query.activo !== 'all') {
        params.push(query.activo === 'true');
        where.push(`${alias}activo=$${params.length}`);
    }
    return { params, where };
}
