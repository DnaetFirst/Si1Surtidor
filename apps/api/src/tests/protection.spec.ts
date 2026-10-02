import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertAccountEditable,assertAdministrativeContinuity,assertImmutableCI,assertPermissionSelection } from '../modules/security/domain/protection';
import { DomainError } from '../shared/domain/errors';

test('Dominio: CI inmutable y continuidad administrativa', () => {
  assert.doesNotThrow(() => assertImmutableCI('123', undefined));
  assert.doesNotThrow(() => assertImmutableCI('123', '123'));
  assert.throws(() => assertImmutableCI('123', '456'), (e: unknown) => e instanceof DomainError && e.statusCode === 400);
  assert.doesNotThrow(() => assertAdministrativeContinuity(true));
  assert.throws(() => assertAdministrativeContinuity(false), (e: unknown) => e instanceof DomainError && e.statusCode === 409);
});

test('Dominio: ATI no modifica ASU ni concede permisos reservados', () => {
  assert.throws(() => assertAccountEditable('ATI', 'ASU'), (e: unknown) => e instanceof DomainError && e.statusCode === 403);
  assert.doesNotThrow(() => assertAccountEditable('ASU', 'ASU'));
  assert.doesNotThrow(() => assertAccountEditable('ATI', 'E'));
  assert.throws(() => assertPermissionSelection('ATI', 1, [{ reservado: true }]));
  assert.throws(() => assertPermissionSelection('ASU', 2, [{ reservado: false }]));
  assert.doesNotThrow(() => assertPermissionSelection('ATI', 1, [{ reservado: false }]));
  assert.doesNotThrow(() => assertPermissionSelection('ASU', 1, [{ reservado: true }]));
});
