# Verificación del ciclo 1

Verificado el 1 de octubre de 2026 con Node.js 22.15.1, PostgreSQL 15.18 y Google Chrome mediante Playwright, sobre Windows.

## Resultado

- Compilación de producción de frontend y backend: correcta.
- Pruebas de arquitectura: **5 aprobadas, 0 fallidas**.
- Pruebas unitarias de dominio y validación: **7 aprobadas, 0 fallidas**.
- Pruebas de integración HTTP/PostgreSQL: **15 aprobadas, 0 fallidas** (incluyen la suite contenedora).
- Pruebas de navegador: **65 aprobadas, 0 fallidas**.
- Las seis pantallas de referencia se verificaron a 360, 390, 768, 1024, 1280 y 1600 px: 36 capturas, sin desbordamiento horizontal de página ni errores JavaScript.
- Se comprobaron en navegador altas, edición, búsqueda y deshabilitación de usuarios, creación de roles, navegación por permisos, login y logout.
- Revisión visual de las capturas de login, usuarios, rol, permisos, empresa y bitácora frente al PDF, incluyendo adaptación móvil. Se conservan las diferencias acordadas por permisos, datos reales y funciones adicionales documentadas.

Comando ejecutado en PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL='chrome'
npm test
```

La variable selecciona el Chrome instalado; sin ella Playwright utiliza su Chromium descargado. El ejecutor crea una base PostgreSQL aislada para cada ejecución, aplica las migraciones y los datos iniciales, y elimina exclusivamente esa base al finalizar. La base local de trabajo se conserva.

## Correcciones comprobadas

La reorganización modular eliminó `BusinessService` y separó los seis paquetes documentados en presentación, aplicación, dominio e infraestructura. Los hooks React consumen contratos inyectados y los casos de uso del backend no contienen SQL. Las pruebas de arquitectura verifican estas restricciones en ambos proyectos. La prueba nueva de atomicidad fuerza un fallo al insertar un evento y comprueba que la creación del rol se revierte en PostgreSQL.

La separación de estilos mantuvo su cascada durante la reorganización. La revisión posterior corrigió el menú compartido de acciones: ancho de 192 px, altura según contenido, separación de 8 px del botón y posición limitada al espacio disponible. Se comprueban Usuarios, Roles y Permisos en los seis anchos, incluyendo teclado, Escape, clic exterior, desplazamiento y cambio de tamaño. La navegación actual muestra únicamente módulos del ciclo 1 y respeta los permisos del actor.

La verificación completa posterior a las correcciones terminó el 1 de octubre de 2026, con `success: true` en `.local/verification.json`. Se actualizaron las rutas de CLI y Docker por el traslado de persistencia a `infrastructure/database`; la migración instalada y los datos de trabajo se conservaron.

Se corrigió el cierre accidental al pulsar el espacio interior de los diálogos, el cierre exterior del menú de cuenta y la restauración del formulario Empresa al cancelar. El guardado de Empresa envía únicamente campos editables, evitando el rechazo de identificadores y fechas internas por la validación de la API. Las pruebas adicionales cubren edición y baja de roles, alta/edición/baja y CSV de permisos, guardado de empresa y filtros/exportación/archivo/consulta de bitácora en móvil.

Se corrigieron el desbordamiento móvil de tablas, la codificación de etiquetas, la asociación accesible de campos y selectores, la respuesta JSON para empresa todavía no registrada y la falsa indicación de sesión expirada al abrir por primera vez. Se agregó una prueba de regresión para logout con cookies anteriores a una renovación, que debe revocar también la sesión renovada.

## Evidencia y límites

El informe interactivo está en `playwright-report/index.html`; las capturas están en `test-results/`. `.local/verification.json` conserva el estado de la última ejecución. Estos archivos son generados y están excluidos de Git.

Docker no está disponible en este equipo: las imágenes y Compose se prepararon, pero no se ejecutaron aquí. No se publicó ningún servicio en Railway. La apariencia se reconstruyó desde imágenes del PDF; no se dispone de las fuentes de diseño originales para certificar igualdad píxel a píxel.
