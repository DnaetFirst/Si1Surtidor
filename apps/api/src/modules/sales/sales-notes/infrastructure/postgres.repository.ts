import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionContext } from '../../../../shared/domain/context';
import { ConflictException } from '../../../../shared/domain/errors';
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
  nv.fecha, nv.hora, nv.estado, nv.estado_b_sisa AS "estadoBSisa",
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

  async validateSaleInput(cmd: CreateSaleCommand, tx?: TransactionContext): Promise<void> {
    const db = database(this.db, tx);
    const [branch] = await db.query(`SELECT id, activo FROM sucursal WHERE id = $1`, [cmd.idSucursal]);
    if (!branch || !branch.activo) {
      throw new ConflictException('La sucursal seleccionada no existe o está inactiva.');
    }

    if (cmd.idDispensador) {
      const [disp] = await db.query(`SELECT id, esta_activo FROM dispensador WHERE id = $1`, [cmd.idDispensador]);
      if (!disp || !disp.esta_activo) {
        throw new ConflictException('El dispensador seleccionado no existe o está inhabilitado.');
      }
    }

    const requestedByProduct = new Map<number, number>();
    for (const d of cmd.detalles) {
      if (d.idManguera) {
        const [hose] = await db.query(
          `SELECT m.id, m.esta_activo, disp.esta_activo AS dispensador_activo
           FROM manguera m
           JOIN dispensador disp ON disp.id = m.id_dispensador
           WHERE m.id = $1`,
          [d.idManguera]
        );
        if (!hose || !hose.esta_activo || !hose.dispensador_activo) {
          throw new ConflictException('La manguera o dispensador seleccionado está inhabilitado.');
        }
      }
      if (d.idProducto) {
        requestedByProduct.set(d.idProducto, (requestedByProduct.get(d.idProducto) || 0) + Number(d.cantidad));
      }
      if (d.idDescuento) {
        const [disc] = await db.query(
          `SELECT id, activo, fecha_inicio, fecha_fin FROM descuento WHERE id = $1`,
          [d.idDescuento]
        );
        if (!disc || !disc.activo) {
          throw new ConflictException('El descuento aplicado no existe o está inactivo.');
        }
        const today = new Date().toISOString().split('T')[0];
        if ((disc.fecha_inicio && String(disc.fecha_inicio).slice(0, 10) > today) ||
            (disc.fecha_fin && String(disc.fecha_fin).slice(0, 10) < today)) {
          throw new ConflictException('El descuento seleccionado se encuentra fuera de vigencia.');
        }
      }
    }

    for (const [productId, requestedQty] of requestedByProduct.entries()) {
      const [prod] = await db.query(
        `SELECT id, nombre, stock, esta_activo FROM producto WHERE id = $1 FOR UPDATE`,
        [productId]
      );
      if (!prod || !prod.esta_activo) {
        throw new ConflictException(`El producto #${productId} no existe o está inactivo.`);
      }
      if (Number(prod.stock) < requestedQty) {
        throw new ConflictException(`Stock insuficiente para ${prod.nombre}: disponible ${prod.stock}, solicitado ${requestedQty}.`);
      }
    }
  }

  async create(cmd: CreateSaleCommand, ciUsuario: string, tx?: TransactionContext): Promise<SaleRecord> {
    const db = database(this.db, tx);
    const code = cmd.codigo || (await this.generateNextCode(tx));

    // Calculate subtotals applying valid discounts per item (CU11 opt: consultarDescuentoVigente)
    const computedLines: { item: (typeof cmd.detalles)[number]; subtotal: number }[] = [];
    let total = 0;

    for (const d of cmd.detalles) {
      const rawSubtotal = Number(d.cantidad) * Number(d.precio);
      let lineSubtotal = rawSubtotal;

      if (d.idDescuento) {
        const [disc] = await db.query(`SELECT tipo, valor FROM descuento WHERE id = $1 AND activo = true`, [d.idDescuento]);
        if (disc) {
          const val = Number(disc.valor || 0);
          lineSubtotal = disc.tipo === 'PORCENTAJE'
            ? Math.max(0, rawSubtotal * (1 - val / 100))
            : Math.max(0, rawSubtotal - val);
        }
      }
      lineSubtotal = Math.round(lineSubtotal * 100) / 100;
      total += lineSubtotal;
      computedLines.push({ item: d, subtotal: lineSubtotal });
    }
    total = Math.round(total * 100) / 100;

    const montoPagado = cmd.montoPagado !== undefined ? Number(cmd.montoPagado) : total;
    const montoCambio = Math.max(0, Math.round((montoPagado - total) * 100) / 100);
    const montoPorCobrar = Math.max(0, Math.round((total - montoPagado) * 100) / 100);

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

    const rows = await db.query(
      `INSERT INTO nota_venta (
         codigo, nombre_cliente, nit, placa, metodo_pago,
         monto_pagado, monto_por_cobrar, monto_cambio,
         estado, estado_b_sisa, ci_usuario, id_dispensador, id_sucursal, id_cliente
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EMITIDA', $9, $10, $11, $12, $13)
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
    for (const { item: d, subtotal } of computedLines) {
      const qty = Number(d.cantidad);
      const prc = Number(d.precio);

      await db.query(
        `INSERT INTO detalle_venta (cantidad, precio, subtotal, id_nota_venta, id_manguera, id_producto, id_descuento)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [qty, prc, subtotal, saleId, d.idManguera || null, d.idProducto || null, d.idDescuento || null]
      );
    }

    const created = await this.findById(saleId, tx);
    return created!;
  }

  async annul(id: number, ciUsuario: string, tx?: TransactionContext): Promise<SaleRecord> {
    const db = database(this.db, tx);
    const sale = await this.findById(id, tx);
    if (!sale) throw new ConflictException('Nota de venta no encontrada.');
    if (sale.estado === 'ANULADA') {
      throw new ConflictException('La nota de venta ya fue anulada.');
    }

    await db.query(`UPDATE nota_venta SET estado = 'ANULADA' WHERE id = $1`, [id]);

    for (const d of sale.detalles || []) {
      if (d.idProducto) {
        await db.query(
          `UPDATE producto SET stock = stock + $1, updated_at = now() WHERE id = $2`,
          [d.cantidad, d.idProducto]
        );
        await db.query(
          `INSERT INTO salida_producto (motivo, cantidad, estado, documento_origen, id_producto, id_nota_venta, ci_usuario, id_sucursal)
           VALUES ($1, $2, 'REVERSA', $3, $4, $5, $6, $7)`,
          [`Anulación de venta ${sale.codigo}`, d.cantidad, sale.codigo, d.idProducto, sale.id, ciUsuario, sale.idSucursal]
        );
      }
    }

    return (await this.findById(id, tx))!;
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
      estado: row.estado || 'EMITIDA',
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
