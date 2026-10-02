# Decisiones del ciclo 1

## Actualización del PDF y reorganización modular

Revisión del PDF actualizado de 138 páginas, realizada el 1 de octubre de 2026. Las páginas 61–68 y 74 identifican seis paquetes; el nuevo es **Gestión de reportes**. Se adoptó una aplicación modular con cuatro capas por funcionalidad: presentación, aplicación, dominio e infraestructura. La sección de diseño arquitectónico de la página 75 no contiene un diagrama que imponga otra distribución técnica.

- **Reportes:** el usuario confirmó preparar su estructura, sin implementar CU14 en este ciclo. La navegación lo muestra como “Próximamente”. La exportación operativa de permisos y bitácora permanece en sus propios casos de uso.
- **CU20:** el usuario confirmó ubicar Gestionar módulos en Usuarios y Seguridad, siguiendo la página 62. La descripción de Empresa en la página 61 todavía lo incluye y se considera inconsistente.
- **Compras:** se conservan CU9 órdenes de compra, CU10 compras y CU13 proveedores de la página 64. La página 67 presenta nombres/números distintos; no se usan para implementar nuevas operaciones.
- **Reportes e inventario:** la descripción de Inventario menciona reportes de existencias, mientras el paquete nuevo agrupa CU14. La generación de reportes queda bajo Reportes; Inventario expondrá consultas cuando se implemente.
- **Correo:** CU2 ahora indica explícitamente correo, por lo que coincide con la decisión y la implementación existentes.
- **Persistencia y compatibilidad:** esta reorganización no cambia tablas, identificadores, datos ni API pública. No se vuelve a inicializar la base ni se cambian credenciales.

La guía técnica está en [arquitectura.md](arquitectura.md). Las decisiones iniciales siguientes siguen aplicándose donde no fueron sustituidas por estas aclaraciones.

Fuente: `SI1-Surtidor.G8 (2).pdf`, casos de uso de las páginas 46–58 y referencias visuales de las páginas 48, 50, 52, 54, 56 y 58. Las decisiones siguientes fueron aceptadas en el plan de implementación y prevalecen cuando las secciones del documento se contradicen.

## Alcance y tecnología

- **NestJS frente a Next.js:** el servidor utiliza NestJS 10, TypeORM y PostgreSQL 15. El cliente utiliza React, TypeScript y Vite. La mención alternativa a Next.js no define un segundo servidor.
- **Primer ciclo:** se implementan CU1 Usuarios, CU2 Autenticación, CU3 Roles, CU4 Permisos, CU16 Empresa y CU17 Bitácora. Los enlaces a funciones posteriores aparecen deshabilitados y etiquetados como próximos.
- **Sucursales:** únicamente hay consulta y referencia opcional desde un usuario. No se implementa su administración. La obligatoriedad de sucursal en el SQL del documento se reemplaza por una columna nullable.
- **SQL de referencia:** se reconstruye mediante migraciones del ciclo 1. No se ejecuta el SQL defectuoso del PDF; se corrige `PRIMQARY KEY` y se agregan restricciones, estados y campos de seguridad necesarios.

## Identidad y autorización

- **Correo frente a nombre de usuario:** se inicia sesión con correo electrónico y contraseña, siguiendo la pantalla de CU2. La identificación persistente de la persona es su CI; teléfono y CI no son cantidades numéricas.
- **Acceso a bitácora:** se requiere sesión y permisos de ASU. No se solicita una segunda contraseña.
- **Matriz inicial:** ATI administra usuarios y roles; ASU administra permisos y bitácora; ATI y Gerente General administran empresa. Gerente de Sucursal y Empleado no reciben funciones administrativas del ciclo 1 por defecto.
- **Permisos del Gerente General en el mockup:** los interruptores ilustrativos de la captura no otorgan acceso a bitácora ni privilegios ASU. Se usa la matriz anterior.
- **Protección del ASU:** ATI puede consultar sus datos básicos, pero no modificar su cuenta ni conceder privilegios reservados. El código de un permiso es estable y su nombre es editable.
- **Continuidad administrativa:** no se puede deshabilitar, reasignar o despojar de sus capacidades al último ATI activo. Los roles/permisos asignados no pueden darse de baja.
- **Sesión:** JWT de acceso de 15 minutos, sesión renovable hasta ocho horas, cookies HttpOnly y protección CSRF. Tres intentos fallidos consecutivos bloquean la cuenta durante 15 minutos. No se agregan excepciones de autenticación exclusivas para pruebas.

## Datos y conservación

- **Una empresa por instalación:** el primer guardado registra la empresa y los posteriores la modifican. No se admiten múltiples empresas ni eliminación.
- **Campos de empresa:** se conserva el formulario de la captura y se agrega URL de logo opcional exigida por los requisitos. La fecha de creación es editable.
- **Usuarios:** cargo y sucursal son opcionales. En edición, una contraseña vacía conserva la existente. La baja es lógica y revoca sesiones.
- **Bitácora:** el archivo es una clasificación consultable, no una eliminación. Los eventos son inmutables; no se registran contraseñas, cookies ni tokens. La exportación comprende todos los resultados filtrados.
- **Fechas:** almacenamiento en UTC y presentación en `America/La_Paz`. Semana, mes y año son periodos calendario; las fechas introducidas por el usuario se interpretan en esa zona.
- **CSV:** los valores que pudieran interpretarse como fórmulas se neutralizan y los campos se escapan. Las exportaciones no contienen hashes ni secretos.

## Fidelidad visual y adaptación

- Las seis capturas guían composición, jerarquía, tipografía, fondo, bordes, botones e iconografía. Se excluyen la interfaz de Chrome, los datos ficticios y los privilegios ilustrativos incompatibles con la autorización.
- Se usa una cuadrícula de espaciado de 8 px: 8, 16, 24, 32, 40, 48, 64, 96 y 128 px. El tamaño de letra y el grosor de borde no necesitan ser múltiplos de ocho.
- Escritorio desde 1280 px: sidebar de 320 px y cabecera de 64 px. Entre 768 y 1279 px: sidebar de 80 px. Por debajo de 768 px: navegación desplegable y controles táctiles de 48 px.
- Formularios de una columna en móvil y tablas con desplazamiento interno. La página no debe producir desplazamiento horizontal.
- Ubuntu local aproxima la tipografía de las capturas. La ausencia de los archivos de diseño originales impide prometer igualdad de rasterización entre motores y sistemas operativos.
- Las pantallas adicionales usan las tarjetas, etiquetas y acciones del formulario Crear rol. Carga, error, vacío, validación y sesión expirada forman parte de la experiencia.

## Entrega y operación

- Se entrega configuración Docker Compose, API OpenAPI, variables de ejemplo, pruebas y preparación de Railway. La publicación en una cuenta externa no forma parte de esta entrega.
- Las credenciales iniciales ASU/ATI se reciben por variables de entorno. No se incluyen contraseñas operativas en el código, capturas o documentación.
- Apache puede servir el cliente y actuar como proxy de `/api`. En producción se requiere HTTPS para las cookies seguras.
