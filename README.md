# Mi Gasolinera · Ciclo 1

Aplicación React + TypeScript, NestJS 10 y PostgreSQL 15 para usuarios, autenticación, roles, permisos, empresa y bitácora. Implementa los seis casos de uso del PDF y sus decisiones aclaradas.

## Arranque local

Requiere Node.js 22.15 o superior y npm. PostgreSQL 15 se incluye como herramienta de desarrollo; no modifica otra instalación de PostgreSQL del equipo.

```powershell
npm ci
npm run setup:local
npm run db:local
```

Mantenga esa terminal abierta. En otra terminal, desde la raíz del proyecto:

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

Abra **http://localhost:5173**. La API se encuentra en **http://localhost:3000/api** y su documentación en **http://localhost:3000/api/docs**.

`setup:local` genera credenciales aleatorias y las guarda en **`.local/ACCESO.txt`** y `.env`. No sobrescribe un `.env` existente. El seed no cambia contraseñas existentes ni reinicia permisos editados. Los archivos privados están excluidos de Git y de Docker.

Los accesos iniciales son:

- **ASU:** administración de permisos y consulta/exportación/archivo de bitácora.
- **ATI:** usuarios, roles y empresa.
- **Gerente General:** empresa; ATI puede crear su cuenta.
- **Gerente de Sucursal y Empleado:** inicio de sesión, sin operaciones de futuros ciclos habilitadas.

La primera instalación no contiene datos comerciales ficticios. Registre la empresa con ATI; los usuarios pueden crearse sin sucursal. La administración de sucursales pertenece al ciclo siguiente y no se incluye.

## Verificación

Con `npm run db:local` ejecutándose:

```powershell
npm run typecheck
npx playwright install chromium
npm test
```

`npm test` compila ambos proyectos, comprueba los límites entre capas, ejecuta las pruebas unitarias, crea una base de datos exclusiva con nombre generado y ejecuta las pruebas API y de navegador. Elimina únicamente esa base al terminar. Utiliza los puertos 3001 y 5174. La base local de trabajo no se modifica.

```powershell
npm run test:isolated:api
npm run test:isolated:e2e
```

El informe visual queda en `playwright-report/index.html`; capturas y trazas, en `test-results/`. El resumen de la última ejecución queda en `.local/verification.json`. Las pruebas incluyen seis anchos: 360, 390, 768, 1024, 1280 y 1600 px.

`test:api` y `test:e2e` son comandos de bajo nivel para un servidor de pruebas ya iniciado; use preferentemente los comandos aislados anteriores.

## Docker Compose

Con Docker Engine/Compose instalado, configure `.env` a partir de `.env.example` o ejecute `setup:local`:

```powershell
docker compose up --build -d
```

Abra **http://localhost:8080**. Compose levanta PostgreSQL 15, API y frontend servido por Apache. Las migraciones y el seed se ejecutan antes del inicio de la API. La base de datos usa un volumen persistente. No expone PostgreSQL a la red del equipo.

Para una instalación HTTPS, configure `DEPLOY_ORIGIN` con el origen público y `COOKIE_SECURE=true`. `TRUST_PROXY=true` está limitado a un salto, el proxy Apache. Los secretos y las contraseñas de bootstrap deben ser propios de cada instalación.

## Estructura y decisiones

- `apps/web/src/modules`: funcionalidades separadas en presentación, aplicación, dominio e infraestructura HTTP.
- `apps/api/src/modules`: módulos de negocio con controladores, casos de uso, contratos y repositorios PostgreSQL.
- `app`: composición de módulos, proveedores y navegación; `shared`: utilidades y contratos transversales.
- `apps/api/src/infrastructure/database`: conexión, migraciones y seed; no cambia el esquema existente.
- `tests`: integración sobre PostgreSQL real y flujos Playwright.
- `infrastructure`: imágenes Docker y configuración Apache.
- `docs/decisiones.md`: contradicciones del PDF y decisiones acordadas.
- `docs/aceptacion.md`: trazabilidad y escenarios de aceptación.
- `docs/api.md`: contratos de integración.
- `docs/despliegue.md`: preparación para Railway.
- [docs/arquitectura.md](docs/arquitectura.md): paquetes, capas, dependencias y guía para agregar funcionalidades.

Los seis paquetes del PDF son Usuarios y Seguridad (`security`), Empresa (`enterprise`), Inventario (`inventory`), Compras (`purchases`), Ventas (`sales`) y Reportes (`reports`). Los cuatro últimos contienen su estructura reservada; Reportes se muestra como “Próximamente”. CU20 queda reservado dentro de Seguridad.

`npm run test:architecture` verifica las dependencias y `npm run test:unit` compila y prueba las reglas y validaciones sin necesitar PostgreSQL.

Las contraseñas se almacenan con scrypt. Los JWT de acceso duran 15 minutos; la sesión permite renovación rotativa hasta ocho horas, mediante cookies HttpOnly y protección CSRF. Las autorizaciones se consultan en servidor en cada petición y se revalidan antes de las mutaciones. La bitácora tiene protección de inmutabilidad en PostgreSQL.

Los cinco roles iniciales corresponden a los actores documentados. ATI puede crear roles y ajustar permisos ordinarios, pero no modificar cuentas ASU ni conceder sus privilegios. Deshabilitar nunca borra usuarios, roles o permisos. El archivo de bitácora conserva los registros para consulta.

## Límites de esta entrega

Inventario, compras, ventas, reportes, módulos y CRUD de sucursales quedan fuera del ciclo 1. Las referencias futuras visibles están deshabilitadas. El PDF no aporta fuentes de diseño ni tipografía original; se emplea Ubuntu local y una reconstrucción de los elementos visuales, conservando la composición acordada. No se ha publicado en Railway.
