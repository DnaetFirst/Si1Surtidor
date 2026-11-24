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

    // 4. Crear Dispensador con mangueras embebidas (flujo completo CU7 UML)
    const dispenserWithHoses = expected(
      await asu.request('POST', '/dispensadores', {
        ubicacion: `Isla Sur ${timestamp.toString().slice(-4)}`,
        capacidadMaxima: 150,
        idSucursal: branchId,
        mangueras: [{ numero: 1, lado: 'B', color: 'VERDE', idCombustible: testFuelId }],
      }),
      201
    );
    assert.equal(dispenserWithHoses.mangueras.length, 1);
  });

  await t.test('CU12: Gestión de Descuentos y Promociones', async () => {
    const timestamp = Date.now();
    // 0. Validar reglas de dominio CU12 (porcentaje <= 100 y rango de fechas válido)
    expected(
      await asu.request('POST', '/descuentos', {
        nombre: `Promo Inválida Pct ${timestamp}`,
        tipo: 'PORCENTAJE',
        valor: 150,
        activo: true,
        idSucursal: branchId,
      }),
      400
    );
    expected(
      await asu.request('POST', '/descuentos', {
        nombre: `Promo Inválida Fechas ${timestamp}`,
        tipo: 'MONTO_FIJO',
        valor: 10,
        fechaInicio: '2026-12-31',
        fechaFin: '2026-01-01',
        activo: true,
        idSucursal: branchId,
      }),
      400
    );

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

    // 3. Modificar y anular orden pendiente (CU9 modificar/eliminar UML)
    const draftOrder = expected(
      await asu.request('POST', '/ordenes-compra', {
        codigo: `ORD-TMP-${timestamp}`,
        motivo: 'Borrador temporal',
        idSucursal: branchId,
        idProveedor: providerId,
        detalles: [{ idProducto: testProductId, cantidad: 5 }],
      }),
      201
    );
    const updatedOrder = expected(
      await asu.request('PATCH', `/ordenes-compra/${draftOrder.id}`, {
        motivo: 'Borrador actualizado antes de anular',
      }),
      200
    );
    assert.equal(updatedOrder.motivo, 'Borrador actualizado antes de anular');
    const deletedOrder = expected(await asu.request('DELETE', `/ordenes-compra/${draftOrder.id}`), 200);
    assert.equal(deletedOrder.estado, 'ANULADA');
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

    // 5. Verificar bloqueo de eliminación de proveedor con dependencias (CU13)
    expected(await asu.request('DELETE', `/proveedores/${providerId}`), 409);
  });

  await t.test('CU19: Salidas de Productos por Mermas/Vencimiento', async () => {
    // Stock antes de la salida
    const productBefore = expected(await asu.request('GET', `/productos`), 200);
    const prodBefore = productBefore.find(p => p.id === testProductId);
    const stockAntes = Number(prodBefore.stock);

    // 0. Validar rechazo ante stock insuficiente (CU19 alt stock)
    expected(
      await asu.request('POST', '/inventario/salidas', {
        motivo: 'Salida imposible por exceso',
        cantidad: stockAntes + 9999,
        idProducto: testProductId,
      }),
      409
    );

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

    // 3. Registrar segunda salida temporal y revertirla verificando restitución
    const tempExit = expected(
      await asu.request('POST', '/inventario/salidas', {
        motivo: 'Salida de prueba para reversión',
        cantidad: 1,
        idProducto: testProductId,
      }),
      201
    );
    const revertedExit = expected(await asu.request('POST', `/inventario/salidas/${tempExit.id}/revertir`), 200);
    assert.equal(revertedExit.estado, 'REVERSA');
    assert.equal(revertedExit.referenciaReversion, tempExit.id);
    const productAfterRevert = expected(await asu.request('GET', `/productos`), 200);
    const prodAfterRevert = productAfterRevert.find(p => p.id === testProductId);
    assert.equal(Number(prodAfterRevert.stock), stockAntes - 2, 'La reversión debe restituir la unidad');
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
    assert.equal(sale.estado, 'EMITIDA');
    assert.ok(Number(sale.montoCambio) > 100, 'El descuento del 5% debe reflejarse en el total y cambio');
    saleId = sale.id;

    // 2. Verificar que el trigger trg_actualizar_stock_venta decrementó el stock en 1
    const productAfter = expected(await asu.request('GET', `/productos`), 200);
    const prodAfter = productAfter.find(p => p.id === testProductId);
    assert.equal(Number(prodAfter.stock), stockAntes - 1, 'El trigger trg_actualizar_stock_venta debe haber decrementado el stock');

    // 3. Rechazar venta con stock insuficiente y probar anulación con restitución
    expected(
      await asu.request('POST', '/ventas', {
        nombreCliente: 'Cliente Exceso',
        nit: '9999999',
        placa: '0000-XXX',
        metodoPago: 'EFECTIVO',
        montoPagado: 100000,
        idSucursal: branchId,
        detalles: [
          {
            tipo: 'TIENDA',
            idProducto: testProductId,
            nombreItem: 'Aceite Exceso',
            cantidad: stockAntes + 9999,
            precio: 45.0,
          },
        ],
      }),
      409
    );

    const tempSale = expected(
      await asu.request('POST', '/ventas', {
        nombreCliente: 'Cliente Anulacion',
        nit: '111222333',
        placa: '1234-XYZ',
        metodoPago: 'EFECTIVO',
        montoPagado: 50.0,
        idSucursal: branchId,
        detalles: [
          {
            tipo: 'TIENDA',
            idProducto: testProductId,
            nombreItem: 'Aceite Temporal',
            cantidad: 1,
            precio: 45.0,
          },
        ],
      }),
      201
    );
    const annulled = expected(await asu.request('POST', `/ventas/${tempSale.id}/anular`), 200);
    assert.equal(annulled.estado, 'ANULADA');
    const productAfterAnnul = expected(await asu.request('GET', `/productos`), 200);
    const prodAfterAnnul = productAfterAnnul.find(p => p.id === testProductId);
    assert.equal(Number(prodAfterAnnul.stock), stockAntes - 1, 'La anulación debe restituir el stock');

    // 4. Obtener detalle de venta
    const fetchedSale = expected(await asu.request('GET', `/ventas/${saleId}`), 200);
    assert.equal(fetchedSale.id, saleId);
    assert.equal(fetchedSale.placa, '3849-ABC');
    assert.equal(fetchedSale.estadoBSisa, true);
  });

  await t.test('CU18: Notificaciones de Stock Mínimo y Recuperación de Contraseña', async () => {
    // 0. Alias UML de recuperación de contraseña (CU18)
    expected(
      await asu.request('POST', '/auth/password-recovery', { correo: credentials.correo }),
      200
    );

    // 0. Crear producto bajo stock mínimo para garantizar alerta activa (CU18)
    const alertProduct = expected(
      await asu.request('POST', '/productos', {
        nombre: `Lubricante Alerta ${Date.now()}`,
        stock: 2,
        stockMinimo: 10,
        descripcion: 'Producto para probar alerta por correo',
        precioVenta: 35.0,
        precioCompra: 22.0,
        idCategoria: 1,
        idSucursal: branchId,
      }),
      201
    );

    // 1. Consultar conteo de notificaciones no leídas
    const countResult = expected(await asu.request('GET', '/inventario/notificaciones/conteo-no-leidas'), 200);
    assert.ok(typeof countResult.noLeidas === 'number');

    // 2. Listar notificaciones y probar despacho por correo electrónico (CU18)
    const notifications = expected(await asu.request('GET', '/inventario/notificaciones?page=1&pageSize=20'), 200);
    assert.ok(Array.isArray(notifications.items) && notifications.items.length > 0);

    const lowAlert = notifications.items.find(n => n.idProducto === alertProduct.id) || notifications.items[0];
    notificationId = lowAlert.id;

    // Verificar envío por correo electrónico sin duplicados
    const sendRes = expected(await asu.request('POST', `/inventario/notificaciones/${notificationId}/enviar-correo`), 200);
    assert.equal(sendRes.ok, true);
    assert.equal(sendRes.sent, 1);

    const batchRes = expected(await asu.request('POST', '/inventario/notificaciones/despachar-correos'), 200);
    assert.equal(batchRes.ok, true);

    // 3. Marcar como leída
    expected(await asu.request('POST', `/inventario/notificaciones/${notificationId}/leida`), 200);

    // 4. Resolver notificación
    expected(await asu.request('PATCH', `/inventario/notificaciones/${notificationId}/resolver`), 200);
  });

  await t.test('CU14: directorio de sucursales en el asistente y en los tres formatos', async () => {
    const branches = expected(await asu.request('GET', '/sucursales'), 200);
    const items = Array.isArray(branches) ? branches : branches.items;
    assert.ok(items.length > 0);

    const response = expected(await asu.request('POST', '/reportes/ia/consultar', {
      prompt: 'Dame el nombre de todas nuestras sucursales',
      sucursalId: branchId,
    }), 200);
    assert.equal(response.provider, 'local-data');
    assert.equal(response.intent.tipo, 'sucursales');
    assert.equal(response.intent.sucursalId, undefined);
    for (const { nombre } of items) assert.ok(response.resumenEjecutivo.includes(nombre));

    const formats = { csv: 'text/csv', excel: 'spreadsheetml.sheet', pdf: 'application/pdf' };
    for (const [format, contentType] of Object.entries(formats)) {
      const file = await asu.request('GET', `/reportes/exportar/${format}?tipo=sucursales`);
      assert.equal(file.status, 200);
      assert.ok(file.headers.get('content-type')?.includes(contentType));
      assert.match(file.headers.get('content-disposition'), /attachment/);
      if (format === 'csv') {
        for (const { nombre } of items) assert.ok(file.text.includes(nombre));
      }
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

    // 8. Validar rechazo de rango inválido y filtro calendario en reportes (CU14)
    expected(await asu.request('GET', '/reportes/ventas?desde=2026-12-31&hasta=2026-01-01'), 400);
    expected(await asu.request('GET', `/reportes/ventas?sucursalId=${branchId}&periodo=mes`), 200);

    // 9. Exportar CSV, Excel y PDF + Comandos por voz e IA
    const csvResponse = await asu.request('GET', '/reportes/exportar/csv?tipo=ventas');
    assert.equal(csvResponse.status, 200);
    assert.ok(csvResponse.text.includes('Codigo') || csvResponse.text.includes('Fecha'));

    const excelResponse = await asu.request('GET', `/reportes/exportar/excel?tipo=ventas&sucursalId=${branchId}`);
    assert.equal(excelResponse.status, 200);
    assert.ok(
      (excelResponse.headers.get('content-type') || '').includes('spreadsheetml.sheet'),
      'Excel debe responder Content-Type XLSX'
    );
    assert.ok(excelResponse.text.startsWith('PK'), 'Excel debe devolver contenedor ZIP/XLSX válido');

    const pdfResponse = await asu.request('GET', `/reportes/exportar/pdf?tipo=ventas&sucursalId=${branchId}`);
    assert.equal(pdfResponse.status, 200);
    assert.ok(
      (pdfResponse.headers.get('content-type') || '').includes('application/pdf'),
      'PDF debe responder Content-Type application/pdf'
    );
    assert.ok(pdfResponse.text.startsWith('%PDF-'), 'PDF debe comenzar con firma %PDF-');

    const voiceCommandsRes = expected(await asu.request('GET', '/reportes/voz/comandos'), 200);
    assert.ok(Array.isArray(voiceCommandsRes) && voiceCommandsRes.length >= 6);

    const aiReportRes = expected(
      await asu.request('POST', '/reportes/ia/consultar', {
        prompt: 'Muéstrame el reporte de ventas de hoy',
        sucursalId: branchId,
        viaVoz: true,
      }),
      200
    );
    assert.ok(typeof aiReportRes.resumenEjecutivo === 'string' && aiReportRes.resumenEjecutivo.length > 10);
    assert.ok(Array.isArray(aiReportRes.hallazgos) && aiReportRes.hallazgos.length > 0);
    assert.equal(aiReportRes.intent?.tipo, 'ventas');
    assert.ok(Array.isArray(aiReportRes.previewRows) && aiReportRes.previewRows.length >= 1, 'Debe incluir filas reales en previewRows');

    const aiStockRes = expected(
      await asu.request('POST', '/reportes/ia/consultar', {
        prompt: '¿Qué productos tienen stock crítico en Excel?',
        sucursalId: branchId,
      }),
      200
    );
    assert.equal(aiStockRes.intent?.tipo, 'inventario');
    assert.equal(aiStockRes.intent?.formato, 'excel');
  });

  await t.test('Inmutabilidad de la Bitácora para operaciones de Ciclos 3 y 4', async () => {
    // Consultar bitácora y verificar registros de acciones de ciclo 3 y 4
    const auditLogs = expected(await asu.request('GET', '/bitacora?pageSize=50'), 200);
    const logs = auditLogs.registros || auditLogs.items || auditLogs;
    assert.ok(Array.isArray(logs));
    assert.ok(logs.length > 0, 'La bitácora debe contener eventos registrados');

    // Verificar que se hayan registrado acciones de compras, ventas, reportes o notificaciones
    const actions = logs.map(l => (l.accion || '').toUpperCase());
    assert.ok(
      actions.some(a =>
        a.includes('PROVEEDOR') ||
        a.includes('ORDEN') ||
        a.includes('COMPRA') ||
        a.includes('VENTA') ||
        a.includes('DISPENSADOR') ||
        a.includes('DESCUENTO') ||
        a.includes('SALIDA') ||
        a.includes('REPORTE') ||
        a.includes('NOTIFICACION')
      ),
      'Debe haber eventos auditados de los casos de uso implementados en Ciclos 3 y 4'
    );
  });
});
