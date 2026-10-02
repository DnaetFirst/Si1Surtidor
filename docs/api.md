# API del ciclo 1

Base local: `http://127.0.0.1:3000/api`. La referencia OpenAPI se sirve desde la aplicación. Las rutas de negocio y `/auth/me` validan la sesión; las capacidades también se verifican en el servidor. Los endpoints de autenticación gestionan explícitamente sus credenciales y `/health` permite comprobar disponibilidad.

## Autenticación y errores

1. `GET /auth/csrf` establece la cookie CSRF y responde `{ "csrfToken": "..." }`.
2. `POST /auth/login` recibe `{ "correo": "...", "contrasena": "..." }`. Enviar las cookies y `X-CSRF-Token` obtenido en el paso anterior.
3. Una respuesta correcta establece cookies HttpOnly de acceso/renovación y devuelve `{ "user": { "ci", "nombre", "correo", "rol": { "id", "codigo", "nombre" }, "permisos": [] } }`.
4. `GET /auth/me` devuelve el mismo objeto `user`, con las capacidades actuales.
5. `POST /auth/refresh` rota la credencial de renovación dentro del plazo máximo de ocho horas. `POST /auth/logout` revoca la sesión y elimina cookies.

Todas las mutaciones, incluido login, renovación y cierre, requieren el token CSRF. Las cookies y el token deben pertenecer a la misma sesión de navegador. No se almacenan credenciales de sesión en localStorage.

Códigos relevantes: `400` validación, `401` sesión o credenciales inválidas, `403` operación sin permiso o CSRF inválido, `404` recurso inexistente, `409` duplicado o restricción del negocio, `423` cuenta bloqueada temporalmente, `429` límite de intentos de acceso. El bloqueo devuelve `retryAfterSeconds`.

## Listados y consultas auxiliares

`GET /usuarios`, `/roles`, `/permisos` y `/bitacora` devuelven `{ "items": [], "total": 0, "page": 1, "pageSize": 10 }`. Admiten `page`, `pageSize` de 1 a 100, `q` y `activo=true|false|all` cuando corresponde.

- `GET /usuarios/:ci`, `/roles/:id` y `/permisos/:id`: detalle de un recurso.
- `GET /roles/opciones`: arreglo de roles activos que el actor puede asignar. ATI no recibe el rol protegido ASU.
- `GET /permisos/asignables`: arreglo de permisos activos asignables a roles; excluye privilegios reservados para ATI.
- `GET /permisos/capacidades`: catálogo de operaciones realmente implementadas que pueden asociarse a un permiso.
- `GET /sucursales`: arreglo de sucursales existentes para la asignación opcional; no hay rutas de administración en este ciclo.

## Usuarios, roles y permisos

`POST /usuarios` recibe CI, nombre, correo, teléfono, cargo opcional, sexo, domicilio, contraseña, `rolId` y `sucursalId` opcional. Los nombres de campo son `ci`, `nombre`, `correo`, `telefono`, `cargo`, `sexo`, `domicilio`, `contrasena`, `rolId` y `sucursalId`. `PATCH /usuarios/:ci` modifica los campos enviados; `contrasena: ""` conserva el hash actual. `POST /usuarios/:ci/deshabilitar` realiza una baja lógica y revoca sesiones. Cambiar el CI no está permitido.

`POST /roles` recibe `{ "nombre": "...", "permisoIds": [] }`; `PATCH /roles/:id` modifica nombre o asignaciones. `POST /roles/:id/deshabilitar` rechaza roles asignados a usuarios. El código del rol es estable.

`POST /permisos` recibe `{ "nombre": "...", "descripcion": "...", "modulo": "usuarios", "accion": "ver" }`; deriva un código estable como `usuarios.ver`. El catálogo cerrado impide crear permisos que no correspondan a una operación real. `PATCH /permisos/:id` cambia únicamente nombre y descripción. `POST /permisos/:id/deshabilitar` rechaza permisos asignados a roles.

Las capacidades `gestionar` agrupan las operaciones del módulo. También existen permisos granulares `ver`, `crear`, `editar` y `deshabilitar` según el catálogo; empresa no admite deshabilitar. Bitácora tiene `ver`, `exportar` y `archivar`. Permisos y bitácora son módulos reservados al ASU.

## Empresa y bitácora

`GET /empresa` devuelve la empresa o `null`. `POST /empresa` la registra una sola vez; `PATCH /empresa` la actualiza. Campos: `nombre`, `telefono`, `direccion`, `correo`, `nombrePropietario`, `fechaCreacion` en `YYYY-MM-DD`, `nit` y `logoUrl` opcional.

`GET /bitacora` admite además `usuario`, `accion`, `desde`, `hasta`, `archivado=true|false` y `periodo=semana|mes|ano|todo`. Los límites de fecha se envían en ISO 8601 con zona, por ejemplo `2026-10-01T00:00:00-04:00`. Los periodos calendario se calculan en `America/La_Paz`; por defecto se consultan eventos no archivados.

`POST /bitacora/archivar` recibe `{ "desde": "...", "hasta": "..." }` y archiva el rango inclusivo. El evento sigue disponible al consultar `archivado=true`. No existen operaciones de edición o eliminación de eventos.

`GET /bitacora/exportar` y `GET /permisos/exportar` reciben los mismos filtros que sus listados y descargan todos los resultados, independientemente de la paginación. Los CSV están codificados en UTF-8 con BOM, escapan las celdas y neutralizan fórmulas.
