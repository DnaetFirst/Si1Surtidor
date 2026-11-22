import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface DashboardSummary {
  ventasHoy: number;
  ventasMes: number;
  transaccionesHoy: number;
  litrosDespachadosHoy: number;
  alertasStockBajo: number;
  dispensadoresActivos: number;
  ultimasVentas: any[];
  ventasPorCombustible: { combustible: string; totalLitros: number; totalBs: number }[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly db: DataSource) {}

  async getDashboardSummary(branchId?: number): Promise<DashboardSummary> {
    const branchFilter = branchId ? `AND nv.id_sucursal = ${branchId}` : '';
    const branchFilterProd = branchId ? `AND pr.id_sucursal = ${branchId}` : '';
    const branchFilterDisp = branchId ? `AND d.id_sucursal = ${branchId}` : '';

    // Ventas hoy
    const ventasHoyRes = await this.db.query(`
      SELECT COALESCE(SUM(monto_pagado - monto_cambio), 0) AS total, COUNT(*)::integer AS count
      FROM nota_venta nv
      WHERE nv.fecha = CURRENT_DATE ${branchFilter}
    `);

    // Ventas mes actual
    const ventasMesRes = await this.db.query(`
      SELECT COALESCE(SUM(monto_pagado - monto_cambio), 0) AS total
      FROM nota_venta nv
      WHERE date_trunc('month', nv.fecha) = date_trunc('month', CURRENT_DATE) ${branchFilter}
    `);

    // Litros despachados hoy
    const litrosHoyRes = await this.db.query(`
      SELECT COALESCE(SUM(dv.cantidad), 0) AS litros
      FROM detalle_venta dv
      JOIN nota_venta nv ON nv.id = dv.id_nota_venta
      WHERE dv.id_manguera IS NOT NULL AND nv.fecha = CURRENT_DATE ${branchFilter}
    `);

    // Alertas stock bajo
    const alertasRes = await this.db.query(`
      SELECT COUNT(*)::integer AS total
      FROM producto pr
      WHERE pr.stock <= pr.stock_minimo AND pr.esta_activo = true ${branchFilterProd}
    `);

    // Dispensadores activos
    const dispRes = await this.db.query(`
      SELECT COUNT(*)::integer AS total
      FROM dispensador d
      WHERE d.esta_activo = true ${branchFilterDisp}
    `);

    // Últimas 8 ventas
    const ultimasVentas = await this.db.query(`
      SELECT nv.id, nv.codigo, nv.nombre_cliente AS "nombreCliente", nv.placa,
             nv.monto_pagado - nv.monto_cambio AS total, nv.metodo_pago AS "metodoPago",
             nv.fecha, nv.hora, s.nombre AS "sucursalNombre"
      FROM nota_venta nv
      JOIN sucursal s ON s.id = nv.id_sucursal
      WHERE 1=1 ${branchFilter}
      ORDER BY nv.id DESC
      LIMIT 8
    `);

    // Ventas por tipo de combustible este mes
    const ventasPorCombustible = await this.db.query(`
      SELECT COALESCE(c.nombre, 'Otros') AS combustible,
             COALESCE(SUM(dv.cantidad), 0) AS "totalLitros",
             COALESCE(SUM(dv.subtotal), 0) AS "totalBs"
      FROM detalle_venta dv
      JOIN nota_venta nv ON nv.id = dv.id_nota_venta
      LEFT JOIN manguera m ON m.id = dv.id_manguera
      LEFT JOIN combustible c ON c.id = m.id_combustible
      WHERE dv.id_manguera IS NOT NULL
        AND date_trunc('month', nv.fecha) = date_trunc('month', CURRENT_DATE) ${branchFilter}
      GROUP BY c.nombre
      ORDER BY "totalBs" DESC
    `);

    return {
      ventasHoy: Number(ventasHoyRes[0]?.total || 0),
      ventasMes: Number(ventasMesRes[0]?.total || 0),
      transaccionesHoy: Number(ventasHoyRes[0]?.count || 0),
      litrosDespachadosHoy: Number(litrosHoyRes[0]?.litros || 0),
      alertasStockBajo: Number(alertasRes[0]?.total || 0),
      dispensadoresActivos: Number(dispRes[0]?.total || 0),
      ultimasVentas: ultimasVentas.map((v: any) => ({ ...v, total: Number(v.total || 0) })),
      ventasPorCombustible: ventasPorCombustible.map((r: any) => ({
        combustible: r.combustible,
        totalLitros: Number(r.totalLitros || 0),
        totalBs: Number(r.totalBs || 0),
      })),
    };
  }

  async getSalesReport(from?: string, to?: string, branchId?: number) {
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (from) {
      params.push(from);
      where += ` AND nv.fecha >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND nv.fecha <= $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      where += ` AND nv.id_sucursal = $${params.length}`;
    }

    const daily = await this.db.query(`
      SELECT nv.fecha,
             COUNT(DISTINCT nv.id)::integer AS transacciones,
             COALESCE(SUM(nv.monto_pagado - nv.monto_cambio), 0) AS "totalVendido",
             COALESCE(SUM(CASE WHEN dv.id_manguera IS NOT NULL THEN dv.subtotal ELSE 0 END), 0) AS "totalCombustible",
             COALESCE(SUM(CASE WHEN dv.id_producto IS NOT NULL THEN dv.subtotal ELSE 0 END), 0) AS "totalTienda"
      FROM nota_venta nv
      LEFT JOIN detalle_venta dv ON dv.id_nota_venta = nv.id
      ${where}
      GROUP BY nv.fecha
      ORDER BY nv.fecha DESC
    `, params);

    const items = await this.db.query(`
      SELECT nv.id, nv.codigo, nv.fecha, nv.hora, nv.nombre_cliente AS "cliente",
             nv.nit, nv.placa, nv.metodo_pago AS "metodoPago",
             (nv.monto_pagado - nv.monto_cambio) AS total,
             s.nombre AS "sucursal", u.nombre AS "cajero"
      FROM nota_venta nv
      JOIN sucursal s ON s.id = nv.id_sucursal
      JOIN usuario u ON u.ci = nv.ci_usuario
      ${where}
      ORDER BY nv.id DESC
      LIMIT 100
    `, params);

    return { daily, items };
  }

  async getDispenserSalesReport(from?: string, to?: string, branchId?: number) {
    const params: any[] = [];
    let where = 'WHERE dv.id_manguera IS NOT NULL';
    if (from) {
      params.push(from);
      where += ` AND nv.fecha >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND nv.fecha <= $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      where += ` AND nv.id_sucursal = $${params.length}`;
    }

    return this.db.query(`
      SELECT d.ubicacion AS dispensador,
             m.nombre AS manguera,
             c.nombre AS combustible,
             s.nombre AS sucursal,
             COUNT(DISTINCT nv.id)::integer AS despachos,
             COALESCE(SUM(dv.cantidad), 0) AS "litrosTotales",
             COALESCE(SUM(dv.subtotal), 0) AS "montoTotalBs"
      FROM detalle_venta dv
      JOIN nota_venta nv ON nv.id = dv.id_nota_venta
      JOIN manguera m ON m.id = dv.id_manguera
      JOIN dispensador d ON d.id = m.id_dispensador
      JOIN combustible c ON c.id = m.id_combustible
      JOIN sucursal s ON s.id = nv.id_sucursal
      ${where}
      GROUP BY d.ubicacion, m.nombre, c.nombre, s.nombre
      ORDER BY "montoTotalBs" DESC
    `, params);
  }

  async getPurchasesReport(from?: string, to?: string, branchId?: number) {
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (from) {
      params.push(from);
      where += ` AND nc.fecha >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND nc.fecha <= $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      where += ` AND nc.id_sucursal = $${params.length}`;
    }

    return this.db.query(`
      SELECT p.nombre AS proveedor,
             p.nit AS "proveedorNit",
             COUNT(DISTINCT nc.id)::integer AS "totalCompras",
             COALESCE(SUM(nc.monto_total), 0) AS "montoTotalBs"
      FROM nota_compra nc
      JOIN proveedor p ON p.id = nc.id_proveedor
      ${where}
      GROUP BY p.nombre, p.nit
      ORDER BY "montoTotalBs" DESC
    `, params);
  }

  async getInventoryStatusReport(branchId?: number) {
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (branchId) {
      params.push(branchId);
      where += ` AND p.id_sucursal = $${params.length}`;
    }

    return this.db.query(`
      SELECT p.id, CAST(p.id AS text) AS codigo, p.nombre, p.stock, p.stock_minimo AS "stockMinimo",
             p.precio_venta AS "precioVenta", 'Unidades' AS unidad,
             c.nombre AS categoria, s.nombre AS sucursal,
             CASE
               WHEN p.stock <= 0 THEN 'AGOTADO'
               WHEN p.stock <= p.stock_minimo THEN 'STOCK CRÍTICO'
               WHEN p.stock <= (p.stock_minimo * 1.5) THEN 'BAJO'
               ELSE 'ÓPTIMO'
             END AS "estadoStock",
             (p.stock * p.precio_venta) AS "valoracionEstimada"
      FROM producto p
      LEFT JOIN categoria c ON c.id = p.id_categoria
      LEFT JOIN sucursal s ON s.id = p.id_sucursal
      ${where}
      ORDER BY (p.stock <= p.stock_minimo) DESC, p.stock ASC
    `, params);
  }

  async getExitsReport(from?: string, to?: string, branchId?: number) {
    const params: any[] = [];
    let where = 'WHERE 1=1';
    if (from) {
      params.push(from);
      where += ` AND sp.fecha >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      where += ` AND sp.fecha <= $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      where += ` AND pr.id_sucursal = $${params.length}`;
    }

    return this.db.query(`
      SELECT sp.motivo,
             COUNT(*)::integer AS registros,
             SUM(sp.cantidad) AS "cantidadTotalBaja",
             pr.nombre AS producto,
             s.nombre AS sucursal
      FROM salida_producto sp
      JOIN producto pr ON pr.id = sp.id_producto
      LEFT JOIN sucursal s ON s.id = pr.id_sucursal
      ${where}
      GROUP BY sp.motivo, pr.nombre, s.nombre
      ORDER BY "cantidadTotalBaja" DESC
    `, params);
  }

  async getTopCustomersReport(limit = 10) {
    return this.db.query(`
      SELECT c.id, c.nombre, c.nit, c.placa,
             c.cantidad_mensual_vendida AS "totalVentas",
             c.ultima_fecha AS "ultimaCompra",
             s.nombre AS sucursal
      FROM cliente c
      LEFT JOIN sucursal s ON s.id = c.id_sucursal
      ORDER BY c.cantidad_mensual_vendida DESC
      LIMIT $1
    `, [limit]);
  }
}
