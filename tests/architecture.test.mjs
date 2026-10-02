import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);
}
const roots = ['apps/api/src', 'apps/web/src'];
const sources = roots.flatMap(files).filter(file => /\.tsx?$/.test(file) && !file.endsWith('.spec.ts'));
const normalize = file => file.replaceAll('\\', '/');
const imports = file => {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  return source.statements.filter(node => ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
    .filter(node => node.moduleSpecifier).map(node => node.moduleSpecifier.text);
};

test('Dominio independiente de frameworks, transporte y persistencia', () => {
  for (const file of sources.filter(file => normalize(file).includes('/domain/'))) {
    for (const spec of imports(file)) {
      assert.ok(spec.startsWith('.'), `${relative('.', file)} importa ${spec}`);
      const target = normalize(resolve(dirname(file), spec));
      assert.ok(target.includes('/domain/'), `${relative('.', file)} depende de ${spec}`);
    }
  }
});

test('Aplicación depende de contratos: sin infraestructura, presentación ni SQL', () => {
  for (const file of sources.filter(file => normalize(file).includes('/application/'))) {
    for (const spec of imports(file)) {
      assert.ok(!['typeorm', 'pg', 'express', 'jsonwebtoken', '@nestjs/swagger'].includes(spec), `${file}: ${spec}`);
      if (spec.startsWith('.')) {
        const target = normalize(resolve(dirname(file), spec));
        assert.doesNotMatch(target, /\/(infrastructure|presentation)\//, `${file}: ${spec}`);
      }
    }
    assert.doesNotMatch(readFileSync(file, 'utf8'), /\b(?:SELECT\s+.+\s+FROM|INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM)\b/i, file);
  }
});

test('Vistas y controladores de funcionalidades no acceden a adaptadores', () => {
  for (const file of sources.filter(file => /\/modules\/.*\/presentation\//.test(normalize(file)))) {
    for (const spec of imports(file)) {
      assert.ok(!['typeorm', 'pg'].includes(spec), `${file}: ${spec}`);
      if (spec.startsWith('.')) assert.doesNotMatch(normalize(resolve(dirname(file), spec)), /\/infrastructure\//, `${file}: ${spec}`);
    }
  }
});

test('Compartido no depende de módulos y no existen servicios generales de negocio', () => {
  for (const file of sources.filter(file => normalize(file).includes('/shared/'))) {
    for (const spec of imports(file)) if (spec.startsWith('.')) assert.doesNotMatch(normalize(resolve(dirname(file), spec)), /\/modules\//, `${file}: ${spec}`);
  }
  assert.ok(!existsSync('apps/api/src/business/business.service.ts'));
  for (const file of sources) assert.doesNotMatch(readFileSync(file, 'utf8'), /\bBusinessService\b/, file);
});

test('Los paquetes futuros tienen cuatro capas sin rutas operativas', () => {
  for (const root of roots) for (const feature of ['inventory', 'purchases', 'sales', 'reports']) {
    for (const layer of ['presentation', 'application', 'domain', 'infrastructure']) {
      const dir = `${root}/modules/${feature}/${layer}`;
      assert.ok(existsSync(`${dir}/README.md`), dir);
      assert.ok(!files(dir).some(file => /\.tsx?$/.test(file)), `${dir}: funcionalidad fuera del ciclo`);
    }
  }
});
