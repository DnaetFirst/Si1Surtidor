import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreateDispenserCommand, CreateHoseCommand, UpdateDispenserCommand, UpdateHoseCommand } from '../domain/commands';
import { DispenserRecord, HoseRecord } from '../domain/models';
import { DispenserRepository } from '../domain/repository';

const dispenserFields = `
  d.id, d.ubicacion, d.capacidad_maxima AS "capacidadMaxima",
  d.esta_activo AS "estaActivo", d.estado, d.id_sucursal AS "idSucursal",
  s.nombre AS "sucursalNombre", d.created_at AS "createdAt", d.updated_at AS "updatedAt"
`;

const hoseFields = `
  m.id, m.nombre, m.numero, m.lado, m.color, m.esta_activo AS "estaActivo", m.estado,
  m.id_dispensador AS "idDispensador", m.id_combustible AS "idCombustible",
  c.nombre AS "combustibleNombre", c.tipo AS "combustibleTipo"
`;

@Injectable()
export class PostgresDispenserRepository extends DispenserRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery, branchId?: number): Promise<PageResult<DispenserRecord>> {
    const { params, where } = filters(query);
    if (branchId) {
      params.push(branchId);
      where.push(`d.id_sucursal = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(d.ubicacion ILIKE $${params.length} OR s.nombre ILIKE $${params.length})`);
    }

    const result = await page(
      this.db,
      dispenserFields,
      'dispensador d LEFT JOIN sucursal s ON s.id = d.id_sucursal',
      where,
      params,
      query,
      'd.id ASC'
    );

    // populate hoses for each dispenser in current page
    for (const dispenser of result.items) {
      dispenser.mangueras = await this.getHoses(dispenser.id);
    }

    return result;
  }

  async findById(id: number, tx?: TransactionContext): Promise<DispenserRecord | null> {
    const [item] = await database(this.db, tx).query(
      `SELECT ${dispenserFields}
       FROM dispensador d
       LEFT JOIN sucursal s ON s.id = d.id_sucursal
       WHERE d.id = $1`,
      [id]
    );
    if (!item) return null;
    item.mangueras = await this.getHoses(id, tx);
    return item;
  }

  async create(data: CreateDispenserCommand, tx: TransactionContext): Promise<DispenserRecord> {
    const [item] = await database(this.db, tx).query(
      `INSERT INTO dispensador (ubicacion, capacidad_maxima, esta_activo, estado, id_sucursal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, ubicacion, capacidad_maxima AS "capacidadMaxima", esta_activo AS "estaActivo", estado, id_sucursal AS "idSucursal", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.ubicacion,
        data.capacidadMaxima,
        data.estaActivo ?? true,
        data.estado || 'Activo',
        data.idSucursal,
      ]
    );
    return (await this.findById(item.id, tx))!;
  }

  async update(id: number, data: UpdateDispenserCommand, tx: TransactionContext): Promise<DispenserRecord> {
    const map: Record<string, unknown> = {
      ubicacion: data.ubicacion,
      capacidad_maxima: data.capacidadMaxima,
      esta_activo: data.estaActivo,
      estado: data.estado,
      id_sucursal: data.idSucursal,
      updated_at: new Date(),
    };

    const entries = Object.entries(map).filter(([, val]) => val !== undefined);
    if (entries.length) {
      await database(this.db, tx).query(
        `UPDATE dispensador SET ${entries.map(([key], i) => `${key} = $${i + 1}`).join(', ')} WHERE id = $${entries.length + 1}`,
        [...entries.map(([, val]) => val), id]
      );
    }
    return (await this.findById(id, tx))!;
  }

  async disable(id: number, tx: TransactionContext): Promise<DispenserRecord> {
    await database(this.db, tx).query(
      `UPDATE dispensador SET esta_activo = false, estado = 'Inactivo', updated_at = now() WHERE id = $1`,
      [id]
    );
    return (await this.findById(id, tx))!;
  }

  async getHoses(dispenserId: number, tx?: TransactionContext): Promise<HoseRecord[]> {
    return database(this.db, tx).query(
      `SELECT ${hoseFields}
       FROM manguera m
       JOIN combustible c ON c.id = m.id_combustible
       WHERE m.id_dispensador = $1 AND m.esta_activo = true
       ORDER BY m.id ASC`,
      [dispenserId]
    );
  }

  async addHose(dispenserId: number, data: CreateHoseCommand, tx: TransactionContext): Promise<HoseRecord> {
    const hoseName = data.nombre || (data.numero ? `Manguera ${data.numero}${data.lado ? `-${data.lado}` : ''}` : 'Manguera');
    const [item] = await database(this.db, tx).query(
      `INSERT INTO manguera (nombre, numero, lado, color, esta_activo, estado, id_dispensador, id_combustible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        hoseName,
        data.numero ?? null,
        data.lado ?? null,
        data.color ?? null,
        data.estaActivo ?? true,
        data.estado || 'Activo',
        dispenserId,
        data.idCombustible,
      ]
    );
    const [full] = await database(this.db, tx).query(
      `SELECT ${hoseFields}
       FROM manguera m
       JOIN combustible c ON c.id = m.id_combustible
       WHERE m.id = $1`,
      [item.id]
    );
    return full;
  }

  async updateHose(hoseId: number, data: UpdateHoseCommand, tx: TransactionContext): Promise<HoseRecord> {
    const map: Record<string, unknown> = {
      nombre: data.nombre,
      id_combustible: data.idCombustible,
      esta_activo: data.estaActivo,
      estado: data.estado,
    };
    const entries = Object.entries(map).filter(([, val]) => val !== undefined);
    if (entries.length) {
      await database(this.db, tx).query(
        `UPDATE manguera SET ${entries.map(([key], i) => `${key} = $${i + 1}`).join(', ')} WHERE id = $${entries.length + 1}`,
        [...entries.map(([, val]) => val), hoseId]
      );
    }
    const [full] = await database(this.db, tx).query(
      `SELECT ${hoseFields}
       FROM manguera m
       JOIN combustible c ON c.id = m.id_combustible
       WHERE m.id = $1`,
      [hoseId]
    );
    return full;
  }

  async disableHose(hoseId: number, tx: TransactionContext): Promise<HoseRecord> {
    await database(this.db, tx).query(
      `UPDATE manguera SET esta_activo = false, estado = 'Inactivo' WHERE id = $1`,
      [hoseId]
    );
    const [full] = await database(this.db, tx).query(
      `SELECT ${hoseFields}
       FROM manguera m
       JOIN combustible c ON c.id = m.id_combustible
       WHERE m.id = $1`,
      [hoseId]
    );
    return full;
  }

  async isBranchActive(branchId: number, tx?: TransactionContext): Promise<boolean> {
    const [row] = await database(this.db, tx).query(
      `SELECT 1 FROM sucursal WHERE id = $1 AND activo = true`,
      [branchId]
    );
    return !!row;
  }

  async isFuelActive(fuelId: number, tx?: TransactionContext): Promise<boolean> {
    const [row] = await database(this.db, tx).query(
      `SELECT 1 FROM combustible WHERE id = $1 AND esta_activo = true`,
      [fuelId]
    );
    return !!row;
  }
}
