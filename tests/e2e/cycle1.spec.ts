import { test, expect, request, type Browser, type BrowserContext, type Page } from '@playwright/test';

type Actor = 'ATI' | 'ASU';
type SessionState = Awaited<ReturnType<BrowserContext['storageState']>>;
const states: Partial<Record<Actor, SessionState>> = {};
const apiURL = process.env.TEST_API_URL || 'http://127.0.0.1:3000/api';
const webURL = process.env.TEST_WEB_URL || 'http://127.0.0.1:5173';
const viewports = [360, 390, 768, 1024, 1280, 1600];
const pages: { name: string; route: string; actor?: Actor; heading: string }[] = [
  { name: 'login', route: '/login', heading: 'Mi Gasolinera' },
  { name: 'usuarios', route: '/usuarios', actor: 'ATI', heading: 'Usuarios' },
  { name: 'crear-rol', route: '/usuarios/roles/crear', actor: 'ATI', heading: 'Crear Rol' },
  { name: 'permisos', route: '/usuarios/permisos', actor: 'ASU', heading: 'Permisos' },
  { name: 'empresa', route: '/empresa', actor: 'ATI', heading: 'Detalles de la Empresa' },
  { name: 'bitacora', route: '/empresa/bitacora', actor: 'ASU', heading: 'Bitácora' },
];

test.beforeAll(async () => {
  for (const actor of ['ATI', 'ASU'] as const) {
    const correo = process.env[`TEST_${actor}_EMAIL`];
    const contrasena = process.env[`TEST_${actor}_PASSWORD`];
    if (!correo || !contrasena) throw new Error(`Defina TEST_${actor}_EMAIL y TEST_${actor}_PASSWORD; use únicamente datos locales de prueba.`);
    const client = await request.newContext();
    const csrf = await client.get(`${apiURL}/auth/csrf`);
    expect(csrf.status()).toBe(200);
    const { csrfToken } = await csrf.json();
    const login = await client.post(`${apiURL}/auth/login`, { data: { correo, contrasena }, headers: { 'X-CSRF-Token': csrfToken } });
    expect(login.status(), `Inicio de sesión de pruebas ${actor}`).toBe(200);
    states[actor] = await client.storageState();
    await client.dispose();
  }
});

async function openPage(browser: Browser, actor: Actor | undefined, width = 1600) {
  const context = await browser.newContext({
    baseURL: webURL, viewport: { width, height: 812 }, storageState: actor ? states[actor] : undefined,
    locale: 'es-BO', timezoneId: 'America/La_Paz',
  });
  return { context, page: await context.newPage() };
}

async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth, document: document.documentElement.scrollWidth, viewport: window.innerWidth,
  }));
  expect(dimensions.body, 'El cuerpo no debe desbordar horizontalmente').toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.document, 'La página no debe desbordar horizontalmente').toBeLessThanOrEqual(dimensions.viewport + 1);
}

for (const target of pages) {
  for (const width of viewports) {
    test(`${target.name}: ${width}px, composición y captura`, async ({ browser }, testInfo) => {
      const { context, page } = await openPage(browser, target.actor, width);
      const exceptions: string[] = [];
      page.on('pageerror', error => exceptions.push(error.message));
      try {
        await page.goto(target.route);
        await expect(page.getByRole('heading', { name: target.heading, exact: true })).toBeVisible();
        await expect(page.locator('.loading')).toHaveCount(0);
        await expect(page.getByRole('alert')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await noHorizontalOverflow(page);
        if (target.actor) {
          if (width < 768) {
            await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
            await expect(page.getByRole('complementary', { name: 'Navegación principal' })).toBeVisible();
            await page.getByRole('button', { name: 'Cerrar menú', exact: true }).click();
          } else {
            const sidebar = await page.getByRole('complementary', { name: 'Navegación principal' }).boundingBox();
            expect(sidebar?.width).toBe(width >= 1280 ? 320 : 80);
          }
        }
        const path = testInfo.outputPath(`${target.name}-${width}.png`);
        await page.screenshot({ path, fullPage: true, animations: 'disabled' });
        await testInfo.attach(`${target.name} a ${width}px`, { path, contentType: 'image/png' });
        expect(exceptions).toEqual([]);
      } finally { await context.close(); }
    });
  }
}

test('ATI crea, busca, edita y deshabilita un usuario con formularios accesibles', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ATI');
  const suffix = `${Date.now()}`;
  const name = `Usuario navegador ${suffix}`;
  try {
    await page.goto('/usuarios');
    await page.getByRole('link', { name: /^Agregar usuario$/i }).click();
    await page.getByLabel('CI', { exact: true }).fill(suffix);
    await page.getByLabel('Nombre completo', { exact: true }).fill(name);
    await page.getByLabel('Correo electrónico', { exact: true }).fill(`browser.${suffix}@example.test`);
    await page.getByLabel('Teléfono', { exact: true }).fill('70000009');
    await page.getByLabel('Domicilio', { exact: true }).fill('Dirección del usuario de pruebas');
    await page.getByLabel('Rol', { exact: true }).selectOption({ label: 'Empleado' });
    const password = page.getByLabel(/^Contraseña/);
    await password.fill(`Segura!${suffix}aA`);
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /^Guardar usuario$/i }).click();
    await expect(page).toHaveURL(/\/usuarios$/);
    await page.getByRole('searchbox').fill(name);
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
    await page.getByLabel(`Acciones de ${name}`, { exact: true }).click();
    await page.getByRole('link', { name: 'Editar usuario', exact: true }).click();
    await page.getByLabel('Nombre completo', { exact: true }).fill(`${name} editado`);
    await page.getByRole('button', { name: /^Guardar usuario$/i }).click();
    await expect(page).toHaveURL(/\/usuarios$/);
    await page.getByRole('searchbox').fill(`${name} editado`);
    await expect(page.getByRole('link', { name: `${name} editado`, exact: true })).toBeVisible();
    await page.getByLabel(`Acciones de ${name} editado`, { exact: true }).click();
    await page.getByRole('button', { name: 'Deshabilitar', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Deshabilitar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No hay resultados', exact: true })).toBeVisible();
  } finally { await context.close(); }
});

test('ATI guarda un rol ordinario sin permisos y la página mantiene sus datos', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ATI');
  const name = `Rol navegador ${Date.now()}`;
  try {
    await page.goto('/usuarios/roles/crear');
    await page.getByLabel('Nombre', { exact: true }).fill(name);
    await page.getByRole('button', { name: /^Guardar rol$/i }).click();
    await expect(page).toHaveURL(/\/usuarios\/roles$/);
    await page.getByRole('searchbox').fill(name);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('searchbox').fill(name);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  } finally { await context.close(); }
});

test('La navegación muestra solo módulos del ciclo 1 y respeta el actor', async ({ browser }) => {
  for (const actor of ['ATI', 'ASU'] as const) {
    const { context, page } = await openPage(browser, actor);
    try {
      await page.goto(actor === 'ATI' ? '/usuarios' : '/usuarios/permisos');
      const navigation = page.getByRole('complementary', { name: 'Navegación principal' });
      await expect(navigation.getByRole('link', { name: actor === 'ATI' ? 'Permisos' : 'Usuarios', exact: true })).toHaveCount(0);
      for (const item of ['Dashboard', 'Sucursales', 'Inventario', 'Productos', 'Combustible', 'Categorías y Grupos', 'Ventas', 'Notas de venta', 'Descuentos', 'Compras', 'Proveedores', 'Órdenes de compra', 'Notas de compra', 'Notificaciones', 'Reportes', 'Configuración', 'Próximamente']) {
        await expect(navigation.getByText(item, { exact: true })).toHaveCount(0);
      }
      await page.goto(actor === 'ATI' ? '/empresa/bitacora' : '/usuarios');
      await expect(page.getByRole('heading', { name: 'Acceso restringido', exact: true })).toBeVisible();
    } finally { await context.close(); }
  }
});

test('El login valida campos y permite una sesión real con cierre desde la cuenta', async ({ browser }) => {
  const { context, page } = await openPage(browser, undefined, 390);
  try {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeFocused();
    await page.getByLabel('Correo electrónico', { exact: true }).fill(process.env.TEST_ATI_EMAIL!);
    const password = page.getByLabel('Contraseña', { exact: true });
    await password.fill(process.env.TEST_ATI_PASSWORD!);
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page).toHaveURL(/\/usuarios$/);
    await page.getByRole('button', { name: 'Mi cuenta', exact: true }).click();
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/login$/);
  } finally { await context.close(); }
});

async function expectInsideViewport(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(15);
  expect(box!.y).toBeGreaterThanOrEqual(15);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width - 15);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height - 15);
  await noHorizontalOverflow(page);
  return box!;
}

for (const width of viewports) {
  for (const target of [
    { route: '/usuarios', actor: 'ATI' as const, name: 'usuarios' },
    { route: '/usuarios/roles', actor: 'ATI' as const, name: 'roles' },
    { route: '/usuarios/permisos', actor: 'ASU' as const, name: 'permisos' },
  ]) {
    test(`Menú ${target.name}: contenido compacto y anclado a ${width}px`, async ({ browser }, testInfo) => {
      const { context, page } = await openPage(browser, target.actor, width);
      try {
        await page.setViewportSize({ width, height: 480 });
        await page.goto(target.route);
        const triggers = page.getByRole('button', { name: /^Acciones de / });
        await expect(triggers.first()).toBeVisible();
        // Exercise the last row near the lower edge, which previously stretched the panel.
        const trigger = triggers.last();
        await trigger.click();
        const menu = page.locator('.row-dropdown');
        await expect(menu).toBeVisible();
        const box = await expectInsideViewport(page, '.row-dropdown');
        const anchor = (await trigger.boundingBox())!;
        expect(box.width).toBe(192);
        expect(box.height).toBeLessThanOrEqual(180);
        const gap = Math.min(Math.abs(box.y - anchor.y - anchor.height), Math.abs(anchor.y - box.y - box.height));
        expect(gap).toBeCloseTo(8, 0);
        const items = menu.locator('a,button');
        if (await items.count()) {
          await expect(items.first()).toBeFocused();
          if (await items.count() > 1) {
            await page.keyboard.press('ArrowDown');
            await expect(items.nth(1)).toBeFocused();
            await page.keyboard.press('Home');
            await expect(items.first()).toBeFocused();
          }
        }
        await page.screenshot({ path: testInfo.outputPath(`menu-${target.name}-${width}.png`) });
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await trigger.click();
        await expect(menu).toBeVisible();
        await page.mouse.click(width - 8, 72);
        await expect(menu).toHaveCount(0);
        await trigger.click();
        await page.setViewportSize({ width, height: 520 });
        await expect(menu).toHaveCount(0);
        await trigger.click();
        await page.evaluate(() => window.scrollBy(0, -80));
        await expect(menu).toHaveCount(0);
      } finally { await context.close(); }
    });
  }
}

for (const width of [390, 768, 1600]) {
  test(`Filtros, confirmaciones y menú de cuenta a ${width}px`, async ({ browser }) => {
    const { context, page } = await openPage(browser, 'ASU', width);
    try {
      await page.goto('/usuarios/permisos');
      await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const box = await expectInsideViewport(page, 'dialog');
      // Interior padding is part of the dialog, not its backdrop.
      await page.mouse.click(box.x + 4, box.y + 4);
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Filtrar', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
      await page.getByLabel('Estado', { exact: true }).selectOption('all');
      await dialog.getByRole('button', { name: 'Aplicar filtros' }).click();
      await expect(dialog).toHaveCount(0);
      await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
      await dialog.getByRole('searchbox').fill('NoExisteEstePermisoXYZ');
      await dialog.getByRole('button', { name: 'Aplicar filtros' }).click();
      await expect(page.getByRole('heading', { name: 'No hay resultados', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
      await expect(page.locator('tbody tr').first()).toBeVisible();

      await page.getByRole('button', { name: 'Mi cuenta', exact: true }).click();
      await expect(page.locator('.account-dropdown')).toBeVisible();
      // Account dropdown uses the header's 8px mobile inset.
      const account = (await page.locator('.account-dropdown').boundingBox())!;
      expect(account.x).toBeGreaterThanOrEqual(8);
      expect(account.x + account.width).toBeLessThanOrEqual(width - 8);
      await page.getByRole('heading', { name: 'Permisos', exact: true }).click();
      await expect(page.locator('.account-dropdown')).toHaveCount(0);

      await page.goto('/usuarios/permisos');
      await page.getByRole('button', { name: 'Acciones de Gestionar permisos', exact: true }).click();
      await page.locator('.row-dropdown').getByRole('button', { name: 'Deshabilitar', exact: true }).click();
      await expectInsideViewport(page, 'dialog');
      await dialog.getByRole('button', { name: 'Deshabilitar', exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('asignado');
      await expectInsideViewport(page, 'dialog');
      await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await expect(dialog).toHaveCount(0);
    } finally { await context.close(); }
  });
}

test('Roles: edición y baja mediante el menú de acciones en móvil', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ATI', 390);
  const name = `Rol móvil ${Date.now()}`;
  try {
    await page.goto('/usuarios/roles/crear');
    await page.getByLabel('Nombre', { exact: true }).fill(name);
    await page.getByRole('button', { name: /^Guardar rol$/i }).click();
    await page.getByRole('searchbox').fill(name);
    await page.getByRole('button', { name: `Acciones de ${name}`, exact: true }).click();
    await page.locator('.row-dropdown').getByRole('link', { name: /Editar rol/i }).click();
    await page.getByLabel('Nombre', { exact: true }).fill(`${name} editado`);
    await page.getByRole('button', { name: /^Guardar rol$/i }).click();
    await page.getByRole('searchbox').fill(`${name} editado`);
    await page.getByRole('button', { name: `Acciones de ${name} editado`, exact: true }).click();
    await page.locator('.row-dropdown').getByRole('button', { name: 'Deshabilitar', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Deshabilitar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No hay resultados', exact: true })).toBeVisible();
  } finally { await context.close(); }
});

test('Permisos: alta, edición, filtros, exportación y baja en móvil', async ({ browser }, testInfo) => {
  const { context, page } = await openPage(browser, 'ASU', 390);
  const name = `Permiso móvil ${Date.now()}`;
  try {
    await page.goto('/usuarios/permisos/crear');
    const available = await (await page.request.get(`${apiURL}/permisos/capacidades`)).json();
    const existing = await (await page.request.get(`${apiURL}/permisos?activo=all&pageSize=100`)).json();
    const capability = available.find((entry: { codigo: string }) => !existing.items.some((item: { codigo: string }) => item.codigo === entry.codigo));
    expect(capability).toBeTruthy();
    await page.getByLabel('Nombre', { exact: true }).fill(name);
    await page.getByLabel('Descripción', { exact: true }).fill('Prueba de flujo y menú');
    await page.getByLabel('Capacidad', { exact: true }).selectOption(capability.codigo);
    await page.getByRole('button', { name: /Guardar permiso/i }).click();
    await expect(page).toHaveURL(/\/usuarios\/permisos$/);
    const filter = async (value: string) => {
      await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
      await expectInsideViewport(page, 'dialog');
      await page.getByRole('dialog').getByRole('searchbox').fill(value);
      await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    };
    await filter(name);
    await page.getByRole('button', { name: `Acciones de ${name}`, exact: true }).click();
    await page.locator('.row-dropdown').getByRole('link', { name: /Editar permiso/i }).click();
    await page.getByLabel('Nombre', { exact: true }).fill(`${name} editado`);
    await page.getByRole('button', { name: /Guardar permiso/i }).click();
    await expect(page).toHaveURL(/\/usuarios\/permisos$/);
    await filter(`${name} editado`);
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar', exact: true }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('permisos.csv');
    await download.saveAs(testInfo.outputPath('permisos.csv'));
    expect(await download.failure()).toBeNull();
    await page.getByRole('button', { name: `Acciones de ${name} editado`, exact: true }).click();
    await page.locator('.row-dropdown').getByRole('button', { name: 'Deshabilitar', exact: true }).click();
    await expectInsideViewport(page, 'dialog');
    await page.getByRole('dialog').getByRole('button', { name: 'Deshabilitar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No hay resultados', exact: true })).toBeVisible();
  } finally { await context.close(); }
});

test('Empresa: guarda y conserva cambios en móvil', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ATI', 390);
  const name = `Empresa móvil ${Date.now()}`;
  try {
    await page.goto('/empresa');
    await expect(page.getByLabel('Nombre', { exact: true })).not.toHaveValue('');
    const original = await page.getByLabel('Nombre', { exact: true }).inputValue();
    await page.getByRole('button', { name: 'Modificar', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Cambio que debe descartarse');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: 'Modificar', exact: true }).click();
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(original);
    await page.getByLabel('Nombre', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('actualizada');
    await page.reload();
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(name);
    await noHorizontalOverflow(page);
  } finally { await context.close(); }
});

test('Bitácora: filtros, CSV, archivo y consulta de archivados en móvil', async ({ browser }, testInfo) => {
  const { context, page } = await openPage(browser, 'ASU', 390);
  try {
    await page.goto('/empresa/bitacora');
    await page.getByRole('button', { name: 'Mes', exact: true }).click();
    await page.getByRole('button', { name: 'Año', exact: true }).click();
    await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
    await expectInsideViewport(page, 'dialog');
    await page.getByLabel('Actividad', { exact: true }).fill('AUTH_LOGIN');
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    await expect(page.locator('tbody tr').first()).toContainText('AUTH_LOGIN');
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar', exact: true }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('bitacora.csv');
    await download.saveAs(testInfo.outputPath('bitacora.csv'));
    await page.getByRole('button', { name: 'Archivar', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expectInsideViewport(page, 'dialog');
    await dialog.getByLabel('Desde', { exact: true }).fill('2000-01-01');
    await dialog.getByLabel('Hasta', { exact: true }).fill('2100-01-01');
    await expect(dialog.getByRole('button', { name: 'Archivar registros', exact: true })).toBeDisabled();
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Archivar registros', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: 'Archivados', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bitácora archivada', exact: true })).toBeVisible();
    await expect(page.locator('tbody tr').first()).toContainText('AUTH_LOGIN');
    await noHorizontalOverflow(page);
  } finally { await context.close(); }
});
