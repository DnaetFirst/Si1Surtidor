import { test, expect, request, type Browser, type BrowserContext, type Page } from '@playwright/test';

type Actor = 'ATI' | 'ASU';
type SessionState = Awaited<ReturnType<BrowserContext['storageState']>>;
const states: Partial<Record<Actor, SessionState>> = {};
const apiURL = process.env.TEST_API_URL || 'http://127.0.0.1:3000/api';
const webURL = process.env.TEST_WEB_URL || 'http://127.0.0.1:5173';
const viewports = [360, 390, 768, 1024, 1280, 1600];

const cycle2Pages: { name: string; route: string; actor: Actor; heading: string }[] = [
  { name: 'productos', route: '/productos', actor: 'ATI', heading: 'Productos' },
  { name: 'crear-combustible', route: '/productos/combustibles/crear', actor: 'ATI', heading: 'Crear Combustible' },
  { name: 'crear-categoria-grupo', route: '/productos/categorias-grupos/crear', actor: 'ATI', heading: 'Crear Categoria' },
  { name: 'modulos', route: '/usuarios/modulos', actor: 'ASU', heading: 'Módulos del Sistema' },
];

test.beforeAll(async () => {
  for (const actor of ['ATI', 'ASU'] as const) {
    const correo = process.env[`TEST_${actor}_EMAIL`];
    const contrasena = process.env[`TEST_${actor}_PASSWORD`];
    if (!correo || !contrasena) throw new Error(`Defina TEST_${actor}_EMAIL y TEST_${actor}_PASSWORD`);
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

for (const target of cycle2Pages) {
  for (const width of viewports) {
    test(`${target.name}: ${width}px, renderizado y responsividad`, async ({ browser }, testInfo) => {
      const { context, page } = await openPage(browser, target.actor, width);
      try {
        await page.goto(target.route);
        await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: target.heading })).toBeVisible();
        await noHorizontalOverflow(page);
        const path = testInfo.outputPath(`${target.name}-${width}.png`);
        await page.screenshot({ path, fullPage: true, animations: 'disabled' });
        await testInfo.attach(`${target.name} a ${width}px`, { path, contentType: 'image/png' });
      } finally {
        await context.close();
      }
    });
  }
}

test('Ciclo 2: Navegación y pestañas de Productos (página 60)', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ATI', 1280);
  try {
    await page.goto('/productos');
    await expect(page.getByRole('tab', { name: 'Combustible' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Otro producto' })).toBeVisible();
    
    // Ver botón Agregar Producto
    const addBtn = page.getByRole('link', { name: 'Agregar Producto' });
    await expect(addBtn).toBeVisible();

    // Cambiar a pestaña Otro producto
    await page.getByRole('tab', { name: 'Otro producto' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Otro producto' })).toBeVisible();

    // Volver a Combustible
    await page.getByRole('tab', { name: 'Combustible' }).click();
    await expect(page.getByText('Gasolina premium')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('Ciclo 2: Crear combustible formulario (página 61)', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ATI', 1280);
  try {
    await page.goto('/productos/combustibles/crear');
    await expect(page.getByText('Detalles del Combustibe')).toBeVisible();
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await expect(page.getByLabel('Octanaje')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Combustible' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Descartar' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('Ciclo 2: Crear categoría o grupo (página 63)', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ATI', 1280);
  try {
    await page.goto('/productos/categorias-grupos/crear');
    await expect(page.getByRole('tab', { name: 'Categoria' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Grupo' })).toBeVisible();
    await expect(page.getByText('FUEL')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar Categoria' })).toBeVisible();

    // Cambiar a tab Grupo
    await page.getByRole('tab', { name: 'Grupo' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Grupo' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('Ciclo 2: Módulos del sistema (CU20)', async ({ browser }) => {
  const { context, page } = await openPage(browser, 'ASU', 1280);
  try {
    await page.goto('/usuarios/modulos');
    await expect(page.getByRole('heading', { name: 'Módulos del Sistema' })).toBeVisible();
    await expect(page.getByText('seguridad', { exact: true })).toBeVisible();
    await expect(page.getByText('inventario', { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});
