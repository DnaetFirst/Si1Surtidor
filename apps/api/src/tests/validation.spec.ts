import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import 'reflect-metadata';
import { assertDateRange,calendarRange } from '../modules/enterprise/audit/domain/calendar';
import { ArchiveDto } from '../modules/enterprise/audit/presentation/dto';
import { UpdateCompanyDto } from '../modules/enterprise/company/presentation/dto';
import { assertReportDateRange, reportCalendarRange } from '../modules/reports/domain/calendar';
import { PREDEFINED_VOICE_COMMANDS, parseVoiceReportIntent } from '../modules/reports/domain/voice-intents';
import { filterDeliverableEmails, renderStockAlertEmail } from '../modules/inventory/notifications/domain/email-alert';
import { UpdateRoleDto } from '../modules/security/roles/presentation/dto';
import { CreateUserDto,UpdateUserDto } from '../modules/security/users/presentation/dto';
import { csv } from '../shared/domain/csv';

test('CSV neutraliza fórmulas, conserva Unicode y escapa comillas/saltos', () => {
  const result = csv(['Nombre', 'Comentario'], [
    ['Ángela', '=HYPERLINK("https://example.test")'],
    ['\t@SUM(1,2)', 'Dos\nlíneas'], ['  +12', '-7'], ['Normal', null],
  ]);
  assert.ok(result.startsWith('\uFEFF'));
  assert.ok(result.includes('"Ángela"'));
  assert.ok(result.includes('"\'=HYPERLINK(""https://example.test"")"'));
  assert.ok(result.includes('"\'\t@SUM(1,2)"'));
  assert.ok(result.includes('"\'  +12","\'-7"'));
  assert.ok(result.includes('"Dos\nlíneas"'));
});

test('Períodos calendario respetan el domingo local aunque UTC ya sea lunes', () => {
  assert.deepEqual(calendarRange('semana', new Date('2026-10-05T02:00:00Z')), {
    desde: '2026-09-28T04:00:00.000Z', hasta: '2026-10-05T03:59:59.999Z',
  });
  assert.deepEqual(calendarRange('mes', new Date('2026-11-01T02:00:00Z')), {
    desde: '2026-10-01T04:00:00.000Z', hasta: '2026-11-01T03:59:59.999Z',
  });
  assert.deepEqual(calendarRange('año', new Date('2027-01-01T02:00:00Z')), {
    desde: '2026-01-01T04:00:00.000Z', hasta: '2027-01-01T03:59:59.999Z',
  });
});

test('Archivo requiere zona horaria explícita y rango coherente', async () => {
  assert.throws(() => assertDateRange('2026-10-02T00:00:00Z', '2026-10-01T00:00:00Z'));
  const errors = await validate(plainToInstance(ArchiveDto, { desde: '2026-10-01', hasta: '2026-10-02' }));
  assert.equal(errors.length, 2);
  const valid = await validate(plainToInstance(ArchiveDto, { desde: '2026-10-01T00:00:00-04:00', hasta: '2026-10-02T00:00:00-04:00' }));
  assert.equal(valid.length, 0);
});

test('PATCH distingue omitir, vaciar contraseña, nullable y requerido nulo', async () => {
  assert.equal((await validate(plainToInstance(UpdateUserDto, { contrasena: '', sucursalId: null }))).length, 0);
  assert.equal((await validate(plainToInstance(UpdateUserDto, {}))).length, 0);
  assert.ok((await validate(plainToInstance(UpdateUserDto, { contrasena: null }))).length);
  assert.ok((await validate(plainToInstance(UpdateUserDto, { nombre: null }))).length);
  assert.ok((await validate(plainToInstance(UpdateRoleDto, { permisoIds: null }))).length);
  assert.equal((await validate(plainToInstance(UpdateCompanyDto, { logoUrl: '' }))).length, 0);
  assert.ok((await validate(plainToInstance(UpdateCompanyDto, { correo: null }))).length);
});

test('Datos rechazados antes de superar límites de PostgreSQL', async () => {
  const valid = { ci: '1234567', nombre: 'Usuario prueba', correo: 'usuario@example.test', telefono: '70000000', sexo: 'M', domicilio: 'Domicilio', contrasena: 'Prueba!123', rolId: 1 };
  assert.equal((await validate(plainToInstance(CreateUserDto, valid))).length, 0);
  const errors = await validate(plainToInstance(CreateUserDto, { ...valid, nombre: 'X'.repeat(101), telefono: '7'.repeat(31), ci: '1'.repeat(21), domicilio: 'X'.repeat(256) }));
  assert.deepEqual(errors.map(error => error.property).sort(), ['ci', 'domicilio', 'nombre', 'telefono']);
  assert.ok((await validate(plainToInstance(CreateUserDto, { ...valid, contrasena: 'Abcde123 ' }))).length);
});

test('Reportes (CU14) validan rango coherente y períodos calendario UTC-04:00', () => {
  assert.doesNotThrow(() => assertReportDateRange('2026-10-01', '2026-10-31'));
  assert.throws(() => assertReportDateRange('2026-11-02', '2026-11-01'));
  assert.deepEqual(reportCalendarRange('semana', new Date('2026-10-05T02:00:00Z')), {
    desde: '2026-09-28',
    hasta: '2026-10-04',
  });
  assert.deepEqual(reportCalendarRange('mes', new Date('2026-11-01T02:00:00Z')), {
    desde: '2026-10-01',
    hasta: '2026-10-31',
  });
  assert.deepEqual(reportCalendarRange('ano', new Date('2027-01-01T02:00:00Z')), {
    desde: '2026-01-01',
    hasta: '2026-12-31',
  });
});

test('Reportes por voz predefinidos e intención Gemini detectan tipo, rango, sucursal y formato', () => {
  assert.ok(PREDEFINED_VOICE_COMMANDS.length >= 6);
  const branches = [
    { id: 1, nombre: 'Biopetrol - Sucursal Central' },
    { id: 2, nombre: 'Biopetrol - Sucursal Norte' },
  ];

  const hoy = parseVoiceReportIntent(
    'Muéstrame el reporte de ventas de hoy en Central en PDF',
    branches,
    new Date('2026-11-26T15:00:00Z'),
  );
  assert.equal(hoy.tipo, 'ventas');
  assert.equal(hoy.desde, '2026-11-26');
  assert.equal(hoy.hasta, '2026-11-26');
  assert.equal(hoy.sucursalId, 1);
  assert.equal(hoy.formato, 'pdf');

  const stock = parseVoiceReportIntent('Qué productos tienen stock crítico en Excel', branches);
  assert.equal(stock.tipo, 'inventario');
  assert.equal(stock.formato, 'excel');

  const semana = parseVoiceReportIntent('Reporte de dispensadores esta semana en Norte', branches);
  assert.equal(semana.tipo, 'dispensadores');
  assert.equal(semana.periodo, 'semana');
  assert.equal(semana.sucursalId, 2);
});

test('Notificaciones por correo (CU18) filtran dominios ficticios, deduplican y escapan HTML', () => {
  const clean = filterDeliverableEmails([
    'asu@migasolinera.local',
    'user@example.com',
    'demo@surtidor.example',
    'ronny0ronaldo@gmail.com',
    'RONNY0RONALDO@gmail.com',
    'gerencia@empresa.bo',
    'sin-arroba',
  ]);
  assert.deepEqual(clean, ['ronny0ronaldo@gmail.com', 'gerencia@empresa.bo']);

  const mail = renderStockAlertEmail({
    id: 1,
    titulo: 'Stock bajo',
    descripcion: 'Alerta <script>alert(1)</script> en depósito',
    fecha: '2026-11-26T14:30:00Z',
    productoNombre: 'Aceite 20W-50',
    stockActual: 2,
    stockMinimo: 10,
    sucursalNombre: 'Sucursal Norte',
    portalUrl: 'https://surtidor.example.bo/productos',
  });
  assert.ok(mail.subject.includes('Aceite 20W-50'));
  assert.ok(!mail.html.includes('<script>'));
  assert.ok(mail.html.includes('&lt;script&gt;'));
  assert.ok(mail.html.includes('Ver Alertas en el Portal'));
});
