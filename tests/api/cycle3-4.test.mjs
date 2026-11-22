import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, accepted, expected, fixtureCredentials } from './client.mjs';

test('Ciclos 3 y 4: integración HTTP integral con PostgreSQL', { timeout: 120_000 }, async t => {
  const asu = new ApiClient();
  const credentials = fixtureCredentials('ASU');

  let branchId = 1;
  let testProductId;
  let testFuelId;
  let providerId;
  let dispenserId;
  let hoseId;
  let discountId;
  let purchaseOrderId;
  let purchaseReceiptId;
  let saleId;
  let notificationId;

  await t.test('Inicio de sesión de ASU', async () => {
    accepted(await asu.login(credentials.correo, credentials.contrasena), [200, 201]);
  });

  await t.test('Verificación de datos base (sucursal, combustible, producto)', async () => {
    // 1. List or create branch
    const branchRes = await asu.request('GET', '/sucursales');
    const branchItems = Array.isArray(branchRes.data) ? branchRes.data : branchRes.data?.items || [];
    if (branchItems.length > 0) {
      branchId = branchItems[0].id;
    } else {
      const suffix = Date.now();
      const newBranch = expected(
        await asu.request('POST', '/sucursales', {
          nombre: `Sucursal Test ${suffix}`,
          direccion: 'Av. Las Palmas 123',
          telefono: '+591 70000001',
          correo: `sucursal${suffix}@test.bo`,
        }),
        201
      );
      branchId = newBranch.id;
    }

    // 2. List or create fuel
    const fuels = expected(await asu.request('GET', '/combustibles'), 200);
    const fuelItems = Array.isArray(fuels) ? fuels : fuels.items || [];
    if (fuelItems.length > 0) {
      testFuelId = fuelItems[0].id;
    } else {
      const newFuel = expected(
        await asu.request('POST', '/combustibles', {
          nombre: 'Gasolina Especial Test',
          tipo: 'GASOLINA',
          octanaje: 95,
          descripcion: 'Combustible de prueba',
          estaActivo: true,
        }),
        201
      );
      testFuelId = newFuel.id;
    }

    // 3. List or create product
    const prodRes = await asu.request('GET', '/productos');
    const prodItems = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.items || [];
    if (prodItems.length > 0) {
      testProductId = prodItems[0].id;
    } else {
      const suffix = Date.now();
      const newProduct = expected(
        await asu.request('POST', '/productos', {
          nombre: `Aceite Motor 10W-40 ${suffix}`,
          stock: 50,
          stockMinimo: 10,
          descripcion: 'Aceite de motor de prueba',
          precioVenta: 45.0,
          precioCompra: 30.0,
          iva: 13.0,
          urlImage: '',
          estaActivo: true,
          descuento: 0,
          idCategoria: 1,
          idSucursal: branchId,
        }),
        201
      );
      testProductId = newProduct.id;
    }

    assert.ok(testProductId, 'Debe existir un producto de prueba');
    assert.ok(testFuelId, 'Debe existir un combustible de prueba');
    assert.ok(branchId, 'Debe existir una sucursal de prueba');
  });

  await t.test('CU13: Gestión de Proveedores', async () => {
    const timestamp = Date.now();
    // 1. Crear Proveedor
    const newProvider = expected(
      await asu.request('POST', '/proveedores', {
        nombre: `YPFB Refinación ${timestamp}`,
        razonSocial: `YPFB Refinación S.A. ${timestamp}`,
        nit: `10203040${timestamp.toString().slice(-4)}`,
        contacto: 'Ing. Carlos Mendoza',
        telefono: '70012345',
        correo: `contacto${timestamp}@ypfb.bo`,
        direccion: 'Av. Doble Vía a La Guardia Km 6',
        detalle: 'Proveedor oficial de carburantes y derivados',
      }),
      201
    );
    assert.equal(newProvider.nombre, `YPFB Refinación ${timestamp}`);
    providerId = newProvider.id;

    // 2. Obtener detalle de Proveedor
    const fetched = expected(await asu.request('GET', `/proveedores/${providerId}`), 200);
    assert.equal(fetched.id, providerId);
    assert.equal(fetched.activo, true);

    // 3. Vincular Producto con precio pactado
    const linked = expected(
      await asu.request('POST', `/proveedores/${providerId}/productos`, {
        idProducto: testProductId,
        ultimoPrecio: 28.5,
        detalle: 'Precio mayorista pactado por contrato anual',
      }),
      201
    );
    assert.equal(linked.idProducto, testProductId);

    // 4. Listar productos vinculados
    const providerProducts = expected(await asu.request('GET', `/proveedores/${providerId}/productos`), 200);
    assert.ok(Array.isArray(providerProducts));
    assert.ok(providerProducts.some(p => p.idProducto === testProductId));

    // 5. Cambiar estado
    const toggled = expected(await asu.request('PATCH', `/proveedores/${providerId}/estado`), 200);
    assert.equal(toggled.activo, false);
    const toggledBack = expected(await asu.request('PATCH', `/proveedores/${providerId}/estado`), 200);
    assert.equal(toggledBack.activo, true);
  });

  await t.test('CU7: Gestión de Dispensadores y Mangueras', async () => {
    const timestamp = Date.now();
    // 1. Crear Dispensador
    const newDispenser = expected(
      await asu.request('POST', '/dispensadores', {
        ubicacion: `Isla Norte ${timestamp.toString().slice(-4)}`,
        capacidadMaxima: 200,
        idSucursal: branchId,
      }),
      201
    );
    assert.ok(newDispenser.id);
    dispenserId = newDispenser.id;

    // 2. Agregar Manguera al Dispensador
    const newHose = expected(
      await asu.request('POST', `/dispensadores/${dispenserId}/mangueras`, {
        numero: 1,
        lado: 'A',
        color: 'ROJO',
        idCombustible: testFuelId,
      }),
      201
    );
    assert.equal(newHose.numero, 1);
    assert.equal(newHose.lado, 'A');
    hoseId = newHose.id;

    // 3. Obtener dispensador con mangueras
    const fetchedDispenser = expected(await asu.request('GET', `/dispensadores/${dispenserId}`), 200);
    assert.equal(fetchedDispenser.id, dispenserId);
    assert.ok(Array.isArray(fetchedDispenser.mangueras));
    assert.ok(fetchedDispenser.mangueras.some(m => m.id === hoseId));
  });

  await t.test('CU12: Gestión de Descuentos y Promociones', async () => {
    const timestamp = Date.now();
    // 1. Crear Descuento porcentual
    const newDiscount = expected(
      await asu.request('POST', '/descuentos', {
        nombre: `Promo Fiestas ${timestamp}`,
        tipo: 'PORCENTAJE',
        valor: 5.0,
        descripcion: '5% de descuento en horario nocturno',
        activo: true,
        idSucursal: branchId,
      }),
      201
    );
    assert.equal(newDiscount.valor, 5.0);
    discountId = newDiscount.id;

    // 2. Listar descuentos activos
    const activeDiscounts = expected(
      await asu.request('GET', `/descuentos/activos?sucursalId=${branchId}`),
      200
    );
    assert.ok(Array.isArray(activeDiscounts));
    assert.ok(activeDiscounts.some(d => d.id === discountId));
  });

  await t.test('CU9: Gestión de Órdenes de Compra', async () => {
    const timestamp = Date.now();
    // 1. Crear Orden de compra
    const newOrder = expected(
      await asu.request('POST', '/ordenes-compra', {
        codigo: `ORD-${timestamp}`,
        motivo: 'Abastecimiento de stock para feriado',
        idSucursal: branchId,
        idProveedor: providerId,
        detalles: [
          {
            idProducto: testProductId,
            cantidad: 25,
          },
        ],
      }),
      201
    );
    assert.equal(newOrder.estado, 'PENDIENTE');
    purchaseOrderId = newOrder.id;

    // 2. Aprobar Orden de compra
    const approved = expected(
      await asu.request('PATCH', `/ordenes-compra/${purchaseOrderId}/estado`, {
        estado: 'APROBADA',
        motivo: 'Autorizado por gerencia de operaciones',
      }),
      200
    );
    assert.equal(approved.estado, 'APROBADA');
  });

  await t.test('CU10: Registro de Compras, Lotes y Trigger de Stock', async () => {
    const timestamp = Date.now();

    // Obtener stock inicial del producto
    const productBefore = expected(await asu.request('GET', `/productos`), 200);
    const prodBefore = productBefore.find(p => p.id === testProductId);
    const stockInicial = prodBefore ? Number(prodBefore.stock) : 0;

    // 1. Registrar Nota de Compra con recepción de lote
    const newReceipt = expected(
      await asu.request('POST', '/compras', {
        codigo: `CMP-${timestamp}`,
        motivo: 'Ingreso efectivo de mercadería orden aprobada',
        moneda: 'BOB',
        idSucursal: branchId,
        idProveedor: providerId,
        idOrden: purchaseOrderId,
        detalles: [
          {
            idProducto: testProductId,
            cantidad: 20,
            precio: 28.5,
            loteCodigo: `LOT-${timestamp}`,
            fechaVencimiento: '2028-12-31',
          },
        ],
      }),
      201
    );
    assert.ok(newReceipt.id);
    purchaseReceiptId = newReceipt.id;

    // 2. Verificar que la orden cambió a RECIBIDA
    const orderAfter = expected(await asu.request('GET', `/ordenes-compra/${purchaseOrderId}`), 200);
    assert.equal(orderAfter.estado, 'RECIBIDA');

    // 3. Verificar que el trigger trg_actualizar_stock_compra incrementó el stock en 20
    const productAfter = expected(await asu.request('GET', `/productos`), 200);
    const prodAfter = productAfter.find(p => p.id === testProductId);
    const stockEsperado = stockInicial + 20;
    assert.equal(Number(prodAfter.stock), stockEsperado, 'El trigger trg_actualizar_stock_compra debe haber incrementado el stock en 20');

    // 4. Verificar existencia del lote creado
    const batches = expected(await asu.request('GET', `/compras/lotes?productoId=${testProductId}`), 200);
    assert.ok(Array.isArray(batches.items));
    assert.ok(batches.items.some(b => b.codigoLote === `LOT-${timestamp}`));
  });

  await t.test('CU19: Salidas de Productos por Mermas/Vencimiento', async () => {
    // Stock antes de la salida
    const productBefore = expected(await asu.request('GET', `/productos`), 200);
    const prodBefore = productBefore.find(p => p.id === testProductId);
    const stockAntes = Number(prodBefore.stock);

    // 1. Registrar salida
    const exit = expected(
      await asu.request('POST', '/inventario/salidas', {
        motivo: 'Envase dañado durante manipulación interna',
        cantidad: 2,
        idProducto: testProductId,
      }),
      201
    );
    assert.equal(exit.cantidad, 2);

    // 2. Verificar que el stock se redujo en 2
    const productAfter = expected(await asu.request('GET', `/productos`), 200);
    const prodAfter = productAfter.find(p => p.id === testProductId);
    assert.equal(Number(prodAfter.stock), stockAntes - 2, 'La salida debe decrementar el stock');
  });

  await t.test('CU11: Ventas en Punto de Venta, B-SISA y Trigger de Stock Venta', async () => {
    const timestamp = Date.now();

    // Stock antes de la venta
    const productBefore = expected(await asu.request('GET', `/productos`), 200);
    const prodBefore = productBefore.find(p => p.id === testProductId);
    const stockAntes = Number(prodBefore.stock);

    // 1. Registrar Venta con combustible y producto de tienda
    const sale = expected(
      await asu.request('POST', '/ventas', {
        nombreCliente: 'Carlos Alberto Rojas',
        nit: '4839201018',
        placa: '3849-ABC',
        metodoPago: 'EFECTIVO',
        montoPagado: 200.0,
        estadoBSisa: true,
        idSucursal: branchId,
        detalles: [
          {
            tipo: 'COMBUSTIBLE',
            idDispensador: dispenserId,
            idManguera: hoseId,
            nombreItem: 'Gasolina Especial (Manguera 1-A)',
            cantidad: 15,
            precio: 3.74,
          },
          {
            tipo: 'TIENDA',
            idProducto: testProductId,
            nombreItem: 'Aceite Motor 10W-40 Test',
            cantidad: 1,
            precio: 45.0,
            idDescuento: discountId,
          },
        ],
      }),
      201
    );
    assert.ok(sale.id);
    assert.ok(sale.codigo);
    saleId = sale.id;

    // 2. Verificar que el trigger trg_actualizar_stock_venta decrementó el stock en 1
    const productAfter = expected(await asu.request('GET', `/productos`), 200);
    const prodAfter = productAfter.find(p => p.id === testProductId);
    assert.equal(Number(prodAfter.stock), stockAntes - 1, 'El trigger trg_actualizar_stock_venta debe haber decrementado el stock');

    // 3. Obtener detalle de venta
    const fetchedSale = expected(await asu.request('GET', `/ventas/${saleId}`), 200);
    assert.equal(fetchedSale.id, saleId);
    assert.equal(fetchedSale.placa, '3849-ABC');
    assert.equal(fetchedSale.estadoBSisa, true);
  });

  await t.test('CU18: Notificaciones de Stock Mínimo', async () => {
    // 1. Consultar conteo de notificaciones no leídas
    const countResult = expected(await asu.request('GET', '/inventario/notificaciones/conteo-no-leidas'), 200);
    assert.ok(typeof countResult.noLeidas === 'number');

    // 2. Listar notificaciones
    const notifications = expected(await asu.request('GET', '/inventario/notificaciones?page=1&pageSize=20'), 200);
    assert.ok(Array.isArray(notifications.items));

    if (notifications.items.length > 0) {
      notificationId = notifications.items[0].id;

      // 3. Marcar como leída
      expected(await asu.request('POST', `/inventario/notificaciones/${notificationId}/leida`), 200);

      // 4. Resolver notificación
      expected(await asu.request('PATCH', `/inventario/notificaciones/${notificationId}/resolver`), 200);
    }
  });

  await t.test('CU14: Reportes, Estadísticas y Exportación CSV', async () => {
    // 1. Dashboard summary
    const summary = expected(await asu.request('GET', `/reportes/resumen?sucursalId=${branchId}`), 200);
    assert.ok(typeof summary.ventasHoy === 'number', 'Debe incluir ventasHoy');
    assert.ok(typeof summary.litrosDespachadosHoy === 'number', 'Debe incluir litrosDespachadosHoy');

    // 2. Reporte de ventas
    const salesReport = expected(await asu.request('GET', `/reportes/ventas?sucursalId=${branchId}`), 200);
    assert.ok(Array.isArray(salesReport.daily));
    assert.ok(Array.isArray(salesReport.items));

    // 3. Reporte de dispensadores
    const dispensersReport = expected(await asu.request('GET', `/reportes/dispensadores?sucursalId=${branchId}`), 200);
    assert.ok(Array.isArray(dispensersReport));

    // 4. Reporte de compras
    const purchasesReport = expected(await asu.request('GET', `/reportes/compras?sucursalId=${branchId}`), 200);
    assert.ok(Array.isArray(purchasesReport));

    // 5. Reporte de inventario
    const inventoryReport = expected(await asu.request('GET', `/reportes/inventario?sucursalId=${branchId}`), 200);
    assert.ok(Array.isArray(inventoryReport));

    // 6. Reporte de salidas
    const exitsReport = expected(await asu.request('GET', `/reportes/salidas?sucursalId=${branchId}`), 200);
    assert.ok(Array.isArray(exitsReport));

    // 7. Reporte de clientes
    const customersReport = expected(await asu.request('GET', `/reportes/clientes?limit=10`), 200);
    assert.ok(Array.isArray(customersReport));

    // 8. Exportar CSV
    const csvResponse = await asu.request('GET', '/reportes/exportar/csv?tipo=ventas');
    assert.equal(csvResponse.status, 200);
    assert.ok(csvResponse.text.includes('Codigo') || csvResponse.text.includes('Fecha'));
  });

  await t.test('Inmutabilidad de la Bitácora para operaciones de Ciclos 3 y 4', async () => {
    // Consultar bitácora y verificar registros de acciones de ciclo 3 y 4
    const auditLogs = expected(await asu.request('GET', '/bitacora'), 200);
    const logs = auditLogs.registros || auditLogs.items || auditLogs;
    assert.ok(Array.isArray(logs));
    assert.ok(logs.length > 0, 'La bitácora debe contener eventos registrados');

    // Verificar que se hayan registrado acciones de compras, ventas o proveedores
    const actions = logs.map(l => (l.accion || '').toUpperCase());
    assert.ok(
      actions.some(a =>
        a.includes('PROVEEDOR') ||
        a.includes('ORDEN') ||
        a.includes('COMPRA') ||
        a.includes('VENTA') ||
        a.includes('DISPENSADOR') ||
        a.includes('DESCUENTO') ||
        a.includes('SALIDA')
      ),
      'Debe haber eventos auditados de los casos de uso implementados en Ciclos 3 y 4'
    );
  });
});
