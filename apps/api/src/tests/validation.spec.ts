import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import 'reflect-metadata';
import { assertDateRange,calendarRange } from '../modules/enterprise/audit/domain/calendar';
import { ArchiveDto } from '../modules/enterprise/audit/presentation/dto';
import { UpdateCompanyDto } from '../modules/enterprise/company/presentation/dto';
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
