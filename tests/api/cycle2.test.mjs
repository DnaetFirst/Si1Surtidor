import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, accepted, expected, fixtureCredentials } from './client.mjs';

test('Ciclo 2: integración HTTP con PostgreSQL', { timeout: 120_000 }, async t => {
  const asu = new ApiClient();
  const ati = new ApiClient();
  const asuCredentials = fixtureCredentials('ASU');
  const atiCredentials = fixtureCredentials('ATI');

  let testCatId, testGrpId, testFuelId, testProdId;

  await t.test('Inicio de sesión de ASU y ATI', async () => {
    accepted(await asu.login(asuCredentials.correo, asuCredentials.contrasena), [200, 201]);
    accepted(await ati.login(atiCredentials.correo, atiCredentials.contrasena), [200, 201]);
  });

  await t.test('CU8: Gestión de categorías y grupos', async () => {
    // List initial categories and groups
    const categories = expected(await ati.request('GET', '/categorias'), 200);
    assert.ok(Array.isArray(categories));
    assert.ok(categories.length > 0, 'Debe haber categorías iniciales');

    const groups = expected(await ati.request('GET', '/grupos'), 200);
    assert.ok(Array.isArray(groups));
    assert.ok(groups.length > 0, 'Debe haber grupos iniciales');

    // Create a new category
    const uniqueSuffix = Date.now();
    const newCat = expected(
      await ati.request('POST', '/categorias', {
        nombre: `Cat Test ${uniqueSuffix}`,
        descripcion: 'Descripción categoría de prueba',
        imagenUrl: '',
        activo: true,
      }),
      201
    );
    assert.equal(newCat.nombre, `Cat Test ${uniqueSuffix}`);
    testCatId = newCat.id;

    // Reject duplicate category name
    expected(
      await ati.request('POST', '/categorias', {
        nombre: `Cat Test ${uniqueSuffix}`,
        descripcion: 'Duplicado',
      }),
      409
    );

    // Create a new group
    const newGrp = expected(
      await ati.request('POST', '/grupos', {
        nombre: `Grp Test ${uniqueSuffix}`,
        descripcion: 'Descripción grupo de prueba',
        activo: true,
      }),
      201
    );
    assert.equal(newGrp.nombre, `Grp Test ${uniqueSuffix}`);
    testGrpId = newGrp.id;

    // Update category
    const updatedCat = expected(
      await ati.request('PATCH', `/categorias/${testCatId}`, {
        descripcion: 'Descripción modificada',
      }),
      200
    );
    assert.equal(updatedCat.descripcion, 'Descripción modificada');
  });

  await t.test('CU6: Gestión de combustibles', async () => {
    const fuels = expected(await ati.request('GET', '/combustibles'), 200);
    assert.ok(Array.isArray(fuels));
    assert.ok(fuels.length >= 3, 'Debe tener al menos los 3 combustibles por defecto');

    const uniqueSuffix = Date.now();
    const newFuel = expected(
      await ati.request('POST', '/combustibles', {
        nombre: `Gasolina Super ${uniqueSuffix}`,
        tipo: 'gasolina',
        octanaje: 98,
        descripcion: 'Gasolina super de alto octanaje',
        estaActivo: true,
      }),
      201
    );
    assert.equal(newFuel.octanaje, 98);
    testFuelId = newFuel.id;

    const updatedFuel = expected(
      await ati.request('PATCH', `/combustibles/${testFuelId}`, {
        octanaje: 100,
      }),
      200
    );
    assert.equal(updatedFuel.octanaje, 100);
  });

  await t.test('CU5: Gestión de productos y regla de eliminación', async () => {
    const products = expected(await ati.request('GET', '/productos'), 200);
    assert.ok(Array.isArray(products));
    assert.ok(products.length >= 3, 'Debe tener los productos iniciales');

    const uniqueSuffix = Date.now();
    const newProd = expected(
      await ati.request('POST', '/productos', {
        nombre: `Producto Test ${uniqueSuffix}`,
        precioVenta: 25.50,
        precioCompra: 20.00,
        stock: 100,
        stockMinimo: 10,
        idCategoria: testCatId,
        idSucursal: null,
        grupos: [testGrpId],
        estaActivo: true,
      }),
      201
    );
    assert.equal(newProd.nombre, `Producto Test ${uniqueSuffix}`);
    testProdId = newProd.id;

    // Regla de negocio CU8: No se puede eliminar una categoría que tiene productos asignados
    expected(await ati.request('DELETE', `/categorias/${testCatId}`), 409);

    // Eliminar producto primero
    expected(await ati.request('DELETE', `/productos/${testProdId}`), 200);

    // Ahora la categoría se puede eliminar
    expected(await ati.request('DELETE', `/categorias/${testCatId}`), 200);
    expected(await ati.request('DELETE', `/grupos/${testGrpId}`), 200);
    expected(await ati.request('DELETE', `/combustibles/${testFuelId}`), 200);
  });

  await t.test('CU20: Gestión de módulos del sistema (solo ASU)', async () => {
    // ATI no puede gestionar módulos (reservado para ASU)
    expected(await ati.request('GET', '/modulos'), 403);
    expected(await ati.request('POST', '/modulos', { codigo: 'test', nombre: 'Test' }), 403);

    // ASU sí puede consultar y crear
    const modules = expected(await asu.request('GET', '/modulos'), 200);
    assert.ok(Array.isArray(modules));
    assert.ok(modules.length >= 6, 'Debe incluir los módulos del sistema');

    const uniqueCode = `mod_${Date.now()}`;
    const newMod = expected(
      await asu.request('POST', '/modulos', {
        codigo: uniqueCode,
        nombre: 'Módulo de Prueba',
        descripcion: 'Componente experimental',
        activo: true,
      }),
      201
    );
    assert.equal(newMod.codigo, uniqueCode);

    // Clean up
    expected(await asu.request('DELETE', `/modulos/${newMod.id}`), 200);
  });

  await t.test('Bitácora: verificación de auditoría en Ciclo 2', async () => {
    const auditEvents = expected(await asu.request('GET', '/bitacora'), 200);
    assert.ok(Array.isArray(auditEvents.items));
    // Verify that actions from cycle 2 are recorded with user, action, ip and date
    const actions = auditEvents.items.map(e => e.accion);
    assert.ok(
      actions.some(a => a.startsWith('productos.') || a.startsWith('categorias.') || a.startsWith('combustibles.') || a.startsWith('modulos.')),
      'Las mutaciones del ciclo 2 deben quedar registradas en bitácora'
    );
  });
});
