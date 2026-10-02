# Arquitectura modular por capas

El proyecto es un monolito modular: una API NestJS, un frontend React y una base PostgreSQL. La reorganización conserva los seis casos de uso del ciclo 1, sus rutas, la matriz de permisos y las tablas existentes. No requiere migrar datos ni volver a ejecutar el aprovisionamiento.

## Paquetes y responsabilidades

- `security` — Usuarios y Seguridad: `auth`, `users`, `roles`, `permissions`. `system-modules` reserva CU20.
- `enterprise` — Empresa: `company`, `branches` (consulta y validación de asignación) y `audit`.
- `inventory` — CU5, CU6, CU8, CU18 y CU19; reservado.
- `purchases` — CU9 órdenes de compra, CU10 compras y CU13 proveedores; reservado.
- `sales` — CU7 dispensadores, CU11 ventas y CU12 descuentos; reservado.
- `reports` — CU14: consulta y CSV de compras, ventas e inventario; reservado.

Los paquetes futuros contienen directorios documentados para las cuatro capas. No registran controladores, endpoints, permisos, tablas ni datos ficticios. Reportes aparece deshabilitado en la navegación. No debe confundirse el paquete técnico `modules` con el caso de uso CU20.

## Capas del backend

Cada funcionalidad implementada se organiza en:

```text
modules/<paquete>/<funcionalidad>/
  presentation/     controladores REST y DTO validados
  application/      servicios que coordinan los casos de uso
  domain/           reglas, modelos, comandos y puertos abstractos
  infrastructure/  adaptadores PostgreSQL, tokens y contraseñas
  <nombre>.module.ts
```

Los controladores reciben y validan HTTP y llaman a la aplicación. La aplicación invoca contratos de dominio. Los repositorios implementan esos contratos con consultas parametrizadas mediante TypeORM; el dominio no importa NestJS, Express ni TypeORM. Se mantienen las consultas SQL existentes en vez de sustituirlas por entidades nuevas durante esta reorganización.

`app/app.module.ts` compone los paquetes. `app/platform.module.ts` vincula los puertos transversales con sus adaptadores: transacciones, auditoría, credenciales, políticas de administración y directorio de sucursales. Es el lugar autorizado para conocer adaptadores de varios paquetes.

`shared/domain` contiene identidad, contexto de solicitud, transacción opaca, errores, paginación y CSV seguro. `shared/infrastructure` implementa la unidad de trabajo y paginación SQL. `shared/presentation` valida listados y traduce errores a HTTP. Ninguna utilidad compartida depende de módulos de negocio.

La conexión, configuración, migraciones y seed están en `infrastructure`. `main.ts` solo configura y arranca el servidor. Se conserva el identificador de migración y `synchronize: false`.

### Dependencias entre módulos

Un módulo puede consumir contratos de `domain` de otro módulo; no puede importar sus repositorios concretos. Por ejemplo, Usuarios valida la sucursal mediante `BranchDirectory`, implementado por Empresa. Los servicios internos de Seguridad comparten `AdministrationPolicy`, sin consultar directamente las tablas desde la aplicación.

Los módulos exportan únicamente los servicios o contratos que necesitan sus consumidores. Los adaptadores se vinculan en módulos Nest o en la composición de la aplicación; no se importan desde casos de uso.

### Transacciones y seguridad

`AdministrativeTransactionService` ejecuta la secuencia:

1. Abrir una transacción y adquirir el bloqueo administrativo compartido.
2. Consultar y bloquear la sesión, usuario y rol actuales; revalidar permisos.
3. Ejecutar el cambio y comprobar las reglas, incluido el último ATI.
4. Insertar el evento mediante `AuditWriter` usando el mismo contexto transaccional.
5. Confirmar todo; cualquier error revierte cambio y evento.

El contexto es opaco fuera de infraestructura. Ningún servicio recibe un `EntityManager`. Las transacciones de login, bloqueo, renovación y cierre también conservan sus bloqueos y sus eventos. `PasswordHasher` y `SessionTokens` aíslan scrypt/JWT de los casos de uso. No se cambiaron tiempos de sesión, cookies ni permisos.

## Capas del frontend

La misma agrupación aparece en `apps/web/src/modules`:

- `presentation`: JSX, componentes de pantalla y estados visibles.
- `application`: hooks, hidratación de formularios, permisos de interfaz, SWR y coordinación de acciones.
- `domain`: modelos, contratos de adaptadores, valores iniciales y reglas puras.
- `infrastructure`: rutas y llamadas HTTP propias de la funcionalidad.

Los hooks reciben sus adaptadores mediante contextos tipados. `app/Providers.tsx` conecta los adaptadores reales y configura Redux, SWR y Router. Las vistas no importan clientes HTTP. Redux conserva la sesión y avisos; SWR conserva datos remotos.

`app` contiene arranque de sesión, rutas y layout. `shared/presentation` separa formularios, tablas, diálogos, estructura y estados. `shared/styles` conserva el orden de la cascada en tokens, base, controles, estructura, componentes, login y responsive. Los tokens de 8 px y las dimensiones acordadas se mantienen.

## Incorporar una funcionalidad

1. Elegir el paquete según el caso de uso y documentar su alcance.
2. Definir modelos y contratos en dominio; implementar reglas puras allí.
3. Escribir el caso de uso contra contratos, usando la unidad de trabajo para cambios relacionados.
4. Implementar repositorios/adaptadores y vincularlos en el módulo o proveedores de la aplicación.
5. Añadir DTO/controlador y, en frontend, hook y vista. Usar componentes y estilos compartidos.
6. Registrar capacidad y navegación solo si la operación está implementada; protegerla también en servidor.
7. Añadir pruebas relevantes y ejecutar `npm test`.

No se debe crear un servicio general que agrupe nuevamente los casos de uso. Los cambios futuros de esquema se hacen con migraciones incrementales; no se reescribe la migración instalada ni se reinicia la base.

## Verificación

- `npm run typecheck`: contratos e imports de ambos proyectos.
- `npm run test:architecture`: independencia del dominio, dirección de dependencias, ausencia de SQL en aplicación y límites de paquetes futuros.
- `npm run test:unit`: reglas de protección, validación, CSV y fechas.
- `npm test`: compilación limpia, arquitectura, unitarias, PostgreSQL aislado y Playwright.

La prueba de atomicidad provoca un fallo controlado de bitácora únicamente en la base temporal del runner y comprueba que el rol tampoco se guarda. La suite existente verifica sesiones, ASU, último ATI, CRUD, empresa única, archivo y exportación. Las capturas responsive cubren seis anchos entre 360 y 1600 px.
