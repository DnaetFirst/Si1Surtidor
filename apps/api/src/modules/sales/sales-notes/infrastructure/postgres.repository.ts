import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ListQuery, PageResult } from '../../../../shared/domain/pagination';
import { database } from '../../../../shared/infrastructure/persistence/transaction';
import { filters, page } from '../../../../shared/infrastructure/persistence/pagination';
import { CreateSaleCommand } from '../domain/commands';
import { CustomerRecord, SaleDetailRecord, SaleRecord } from '../domain/models';
import { SaleRepository } from '../domain/repository';

const saleFields = `
  nv.id, nv.codigo, nv.nombre_cliente AS "nombreCliente", nv.nit, nv.placa,
  nv.metodo_pago AS "metodoPago", nv.monto_pagado AS "montoPagado",
  nv.monto_por_cobrar AS "montoPorCobrar", nv.monto_cambio AS "montoCambio",
  nv.fecha, nv.hora, nv.estado_b_sisa AS "estadoBSisa",
  nv.ci_usuario AS "ciUsuario", u.nombre AS "usuarioNombre",
  nv.id_dispensador AS "idDispensador", d.ubicacion AS "dispensadorUbicacion",
  nv.id_sucursal AS "idSucursal", s.nombre AS "sucursalNombre",
  nv.id_cliente AS "idCliente", nv.created_at AS "createdAt"
`;

const detailFields = `
  dv.id, dv.id_nota_venta AS "idNotaVenta",
  dv.id_producto AS "idProducto", pr.nombre AS "productoNombre",
  dv.id_manguera AS "idManguera", m.nombre AS "mangueraNombre", c.nombre AS "combustibleNombre",
  dv.id_descuento AS "idDescuento", ds.nombre AS "descuentoNombre", ds.valor AS "descuentoMonto",
  dv.cantidad, dv.precio, dv.subtotal
`;

const customerFields = `
  c.id, c.nombre, c.nit, c.placa,
  c.cantidad_mensual_vendida AS "cantidadMensualVendida",
  c.ultima_fecha AS "ultimaFecha",
  c.id_sucursal AS "idSucursal",
  c.created_at AS "createdAt"
`;

@Injectable()
export class PostgresSaleRepository extends SaleRepository {
  constructor(private readonly db: DataSource) {
    super();
  }

  async list(query: ListQuery, branchId?: number, tx?: TransactionContext): Promise<PageResult<SaleRecord>> {
    const { params, where } = filters(query);
    if (branchId) {
      params.push(branchId);
      where.push(`nv.id_sucursal = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(nv.codigo ILIKE $${params.length} OR nv.nombre_cliente ILIKE $${params.length} OR nv.nit ILIKE $${params.length} OR nv.placa ILIKE $${params.length})`);
    }

    const result = await page(
      database(this.db, tx),
      saleFields,
      `nota_venta nv
       JOIN usuario u ON u.ci = nv.ci_usuario
       JOIN sucursal s ON s.id = nv.id_sucursal
       LEFT JOIN dispensador d ON d.id = nv.id_dispensador`,
      where,
      params,
      query,
      'nv.id DESC'
    );

    return {
      items: result.items.map(this.mapSaleRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async findById(id: number, tx?: TransactionContext): Promise<SaleRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT ${saleFields}
       FROM nota_venta nv
       JOIN usuario u ON u.ci = nv.ci_usuario
       JOIN sucursal s ON s.id = nv.id_sucursal
       LEFT JOIN dispensador d ON d.id = nv.id_dispensador
       WHERE nv.id = $1`,
      [id]
    );
    if (!rows.length) return null;

    const sale = this.mapSaleRow(rows[0]);
    const details = await database(this.db, tx).query(
      `SELECT ${detailFields}
       FROM detalle_venta dv
       LEFT JOIN producto pr ON pr.id = dv.id_producto
       LEFT JOIN manguera m ON m.id = dv.id_manguera
       LEFT JOIN combustible c ON c.id = m.id_combustible
       LEFT JOIN descuento ds ON ds.id = dv.id_descuento
       WHERE dv.id_nota_venta = $1
       ORDER BY dv.id ASC`,
      [id]
    );
    sale.detalles = details.map(this.mapDetailRow);
    sale.totalVenta = (sale.detalles ?? []).reduce((acc, d) => acc + d.subtotal, 0);
    return sale;
  }

  async findByCode(codigo: string, tx?: TransactionContext): Promise<SaleRecord | null> {
    const rows = await database(this.db, tx).query(
      `SELECT id FROM nota_venta WHERE lower(codigo) = lower($1)`,
      [codigo.trim()]
    );
    if (!rows.length) return null;
    return this.findById(rows[0].id, tx);
  }

  async generateNextCode(tx?: TransactionContext): Promise<string> {
    const rows = await database(this.db, tx).query(`SELECT count(*)::integer AS total FROM nota_venta`);
    const count = (rows[0]?.total ?? 0) + 1;
    return `NV-${String(count).padStart(6, '0')}`;
  }

  async findOrCreateCustomer(nit: string, nombre: string, placa: string, branchId?: number, tx?: TransactionContext): Promise<CustomerRecord> {
    const cleanNit = nit?.trim() || '0';
    const cleanPlaca = placa?.trim().toUpperCase() || '';
    const cleanNombre = nombre?.trim() || 'Sin Nombre';

    const existing = await database(this.db, tx).query(
      `SELECT ${customerFields} FROM cliente c WHERE c.nit = $1 LIMIT 1`,
      [cleanNit]
    );
    if (existing.length > 0 && cleanNit !== '0') {
      // update visit count & latest date
      await database(this.db, tx).query(
        `UPDATE cliente
         SET cantidad_mensual_vendida = cantidad_mensual_vendida + 1,
             ultima_fecha = CURRENT_DATE,
             placa = CASE WHEN $1 != '' THEN $1 ELSE placa END,
             nombre = CASE WHEN $2 != 'Sin Nombre' THEN $2 ELSE nombre END
         WHERE id = $3`,
        [cleanPlaca, cleanNombre, existing[0].id]
      );
      const updated = await database(this.db, tx).query(
        `SELECT ${customerFields} FROM cliente c WHERE c.id = $1`,
        [existing[0].id]
      );
      return this.mapCustomerRow(updated[0]);
    }

    // create new customer
    const inserted = await database(this.db, tx).query(
      `INSERT INTO cliente (nombre, nit, placa, cantidad_mensual_vendida, ultima_fecha, id_sucursal)
       VALUES ($1, $2, $3, 1, CURRENT_DATE, $4)
       RETURNING id`,
      [cleanNombre, cleanNit, cleanPlaca, branchId || null]
    );
    const created = await database(this.db, tx).query(
      `SELECT ${customerFields} FROM cliente c WHERE c.id = $1`,
      [inserted[0].id]
    );
    return this.mapCustomerRow(created[0]);
  }

  async listCustomers(query: ListQuery, tx?: TransactionContext): Promise<PageResult<CustomerRecord>> {
    const { params, where } = filters(query);
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(`(c.nombre ILIKE $${params.length} OR c.nit ILIKE $${params.length} OR c.placa ILIKE $${params.length})`);
    }

    const result = await page(
      database(this.db, tx),
      customerFields,
      'cliente c',
      where,
      params,
      query,
      'c.id DESC'
    );

    return {
      items: result.items.map(this.mapCustomerRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async create(cmd: CreateSaleCommand, ciUsuario: string, tx?: TransactionContext): Promise<SaleRecord> {
    const code = cmd.codigo || (await this.generateNextCode(tx));

    // Calculate subtotal and discounts
    let total = 0;
    for (const d of cmd.detalles) {
      total += Number(d.cantidad) * Number(d.precio);
    }

    const montoPagado = Number(cmd.montoPagado) || total;
    const montoCambio = Math.max(0, montoPagado - total);
    const montoPorCobrar = Math.max(0, total - montoPagado);

    // Register or find customer
    let clienteId: number | null = null;
    if (cmd.nit && cmd.nit !== '0') {
      const customer = await this.findOrCreateCustomer(
        cmd.nit,
        cmd.nombreCliente || 'Sin Nombre',
        cmd.placa || '',
        cmd.idSucursal,
        tx
      );
      clienteId = customer.id;
    }

    const rows = await database(this.db, tx).query(
      `INSERT INTO nota_venta (
         codigo, nombre_cliente, nit, placa, metodo_pago,
         monto_pagado, monto_por_cobrar, monto_cambio,
         estado_b_sisa, ci_usuario, id_dispensador, id_sucursal, id_cliente
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        code,
        cmd.nombreCliente || 'Sin Nombre',
        cmd.nit || '0',
        cmd.placa || '',
        cmd.metodoPago || 'EFECTIVO',
        montoPagado,
        montoPorCobrar,
        montoCambio,
        cmd.estadoBSisa ?? true,
        ciUsuario,
        cmd.idDispensador || null,
        cmd.idSucursal,
        clienteId,
      ]
    );
    const saleId = Number(rows[0].id);

    // Insert details (Postgres trigger trg_actualizar_stock_venta fires for each product item automatically)
    for (const d of cmd.detalles) {
      const qty = Number(d.cantidad);
      const prc = Number(d.precio);
      const sub = qty * prc;

      await database(this.db, tx).query(
        `INSERT INTO detalle_venta (cantidad, precio, subtotal, id_nota_venta, id_manguera, id_producto, id_descuento)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [qty, prc, sub, saleId, d.idManguera || null, d.idProducto || null, d.idDescuento || null]
      );
    }

    const created = await this.findById(saleId, tx);
    return created!;
  }

  private mapSaleRow(row: any): SaleRecord {
    return {
      id: Number(row.id),
      codigo: row.codigo,
      nombreCliente: row.nombreCliente || 'Sin Nombre',
      nit: row.nit || '0',
      placa: row.placa || '',
      metodoPago: row.metodoPago,
      montoPagado: Number(row.montoPagado || 0),
      montoPorCobrar: Number(row.montoPorCobrar || 0),
      montoCambio: Number(row.montoCambio || 0),
      fecha: typeof row.fecha === 'string' ? row.fecha : row.fecha?.toISOString?.()?.split('T')[0] ?? '',
      hora: row.hora || '',
      estadoBSisa: Boolean(row.estadoBSisa),
      ciUsuario: row.ciUsuario,
      usuarioNombre: row.usuarioNombre || '',
      idDispensador: row.idDispensador ? Number(row.idDispensador) : null,
      dispensadorUbicacion: row.dispensadorUbicacion || null,
      idSucursal: Number(row.idSucursal),
      sucursalNombre: row.sucursalNombre || '',
      idCliente: row.idCliente ? Number(row.idCliente) : null,
      createdAt: row.createdAt,
    };
  }

  private mapDetailRow(row: any): SaleDetailRecord {
    return {
      id: Number(row.id),
      idNotaVenta: Number(row.idNotaVenta),
      idProducto: row.idProducto ? Number(row.idProducto) : null,
      productoNombre: row.productoNombre || null,
      idManguera: row.idManguera ? Number(row.idManguera) : null,
      mangueraNombre: row.mangueraNombre || null,
      combustibleNombre: row.combustibleNombre || null,
      idDescuento: row.idDescuento ? Number(row.idDescuento) : null,
      descuentoNombre: row.descuentoNombre || null,
      descuentoMonto: row.descuentoMonto ? Number(row.descuentoMonto) : null,
      cantidad: Number(row.cantidad),
      precio: Number(row.precio),
      subtotal: Number(row.subtotal),
    };
  }

  private mapCustomerRow(row: any): CustomerRecord {
    return {
      id: Number(row.id),
      nombre: row.nombre,
      nit: row.nit,
      placa: row.placa,
      cantidadMensualVendida: Number(row.cantidadMensualVendida || 0),
      ultimaFecha: typeof row.ultimaFecha === 'string' ? row.ultimaFecha : row.ultimaFecha?.toISOString?.()?.split('T')[0] ?? null,
      idSucursal: row.idSucursal ? Number(row.idSucursal) : null,
      createdAt: row.createdAt,
    };
  }
}
