# Verificación del ciclo 1

## Evidencia y límites

La existencia de una prueba no significa que haya sido ejecutada. Los resultados reproducibles de una ejecución se guardan en los artefactos del corredor; el informe de entrega debe indicar por separado qué comandos pasaron y qué verificaciones permanecen pendientes.

Las pruebas de integración se ejecutan contra una instancia real del backend y PostgreSQL. Usar una base de datos exclusiva para pruebas: se crean y deshabilitan usuarios, roles y permisos de prueba, se edita la empresa y se archivan eventos. No ejecutar estas pruebas contra una instalación de uso real.

## Ejecución reproducible

Con las dependencias instaladas, `.env` configurado y PostgreSQL local en ejecución:

```powershell
npm test
```

El corredor compila la aplicación, crea una base temporal con nombre único, aplica migraciones y semillas, inicia API y frontend aislados, ejecuta ambas suites y elimina exclusivamente la base de esta ejecución. Las credenciales proceden de las variables de bootstrap; no se imprimen. La API de pruebas usa el puerto 3001 y el cliente 5174.

Para ejecutar una sola parte:

```powershell
npm run test:isolated:api
npm run test:isolated:e2e
```

Se requiere Chromium de Playwright (`npx playwright install chromium`) para la suite de navegador. `playwright-report/` contiene el informe y las capturas adjuntas; `test-results/` conserva las imágenes por pantalla/ancho y las trazas de fallos. `.local/verification.json` identifica la última ejecución y si finalizó correctamente.

Los comandos de bajo nivel `test:api` y `test:e2e` reutilizan el servidor y la base indicada en el entorno. Están destinados a depuración con datos desechables. Para repetir pruebas normalmente se prefiere el corredor aislado, porque el catálogo finito de capacidades impide volver a crear un permiso dado de baja.

La suite API requiere `TEST_ASU_EMAIL`, `TEST_ASU_PASSWORD`, `TEST_ATI_EMAIL`, `TEST_ATI_PASSWORD` y admite `TEST_API_URL`. `TEST_DATABASE_URL` habilita la verificación de temporización e inmutabilidad mediante fixtures SQL. La suite de navegador admite también `TEST_WEB_URL`. El corredor aislado define estas variables por sí mismo.

## Trazabilidad funcional

- **CU1, Usuarios (páginas 46–48):** alta, consulta, búsqueda, edición y baja lógica; duplicados de CI/correo; contraseña fuerte; sucursal opcional; conservación de contraseña vacía; protección del ASU y del último ATI; revocación de sesiones.
- **CU2, Autenticación (páginas 49–50):** correo/contraseña; rechazo de credenciales inválidas; bloqueo al tercer fallo; bloqueo de 15 minutos; renovación; expiración; cierre; protección CSRF; usuario deshabilitado; registro de eventos.
- **CU3, Roles (páginas 51–52):** permisos agrupados, alta/edición/baja, nombre único, rechazo de baja si está asignado, capacidades actuales en sesiones existentes y prohibición de otorgar privilegios ASU desde ATI.
- **CU4, Permisos (páginas 53–54):** alta/consulta/edición/baja, código estable, unicidad, filtro, exportación CSV completa y rechazo de baja si está asignado.
- **CU16, Empresa (páginas 55–56):** registro único, consulta y modificación, campos de la captura y URL de logo opcional; acceso de ATI/Gerente General y rechazo a otros actores sin capacidad.
- **CU17, Bitácora (páginas 57–58):** usuario, acción, resultado, fecha, IP y endpoint; filtros; periodos calendario; exportación de todos los resultados; archivo por fechas; consulta/exportación de archivados; eventos inmutables y sin secretos.

## Revisión visual

Comparar la aplicación a 1600 × 812 px con el área de contenido de las capturas. Las referencias PDF incluyen 87 px de interfaz de Chrome que se excluyen de la comparación.

- Página 48: Usuarios, contenido de ancho limitado, búsqueda alineada con acción de alta, filas y paginación.
- Página 50: Login, marca y formulario centrados de 352 px, botón negro y surtidor decorativo.
- Página 52: Crear rol, acciones superiores, tarjetas de detalles y permisos, grupos con interruptores.
- Página 54: Permisos, acciones Filtrar/Exportar/Agregar y tarjeta con listado.
- Página 56: Empresa, formulario de dos columnas, dirección completa y acción Guardar.
- Página 58: Bitácora, selector Semana/Mes/Año, acciones y tabla de actividad.

Las diferencias autorizadas se limitan a datos reales, permisos del actor, funciones del ciclo 1, requisitos ausentes en el mockup, responsive y cuadrícula de 8 px. La prueba automatizada toma capturas y comprueba desbordamientos; la semejanza con el PDF requiere revisión visual humana de esas capturas.

## Escenarios responsive y accesibilidad

Validar anchos 360, 390, 768, 1024, 1280 y 1600 px. Comprobar login, usuarios, rol, permisos, empresa y bitácora; ninguna página debe desbordar horizontalmente. Las tablas pueden desplazar su propio contenedor.

- Verificar navegación completa con teclado, foco visible, campos etiquetados y cierre de diálogos.
- En móvil, abrir/cerrar el menú y acceder a acciones de la página; formulario de una columna y controles usables al tacto.
- En tablet, comprobar sidebar compacta y grupos de permisos en dos columnas.
- En escritorio, comprobar sidebar de 320 px, cabecera de 64 px y proporciones de las referencias.
- Comprobar estados de carga, sin resultados, validación, error de red, envío y sesión expirada.

## Verificaciones de seguridad y persistencia

- Probar los endpoints directamente; ocultar un enlace no constituye autorización.
- Confirmar que sesión/capacidades se consultan en el servidor y una edición de permisos afecta sesiones existentes.
- Confirmar unicidad con solicitudes concurrentes y datos consultables mediante una sesión nueva.
- Comprobar que una cookie de sesión robada de una respuesta anterior deja de servir después de cerrar sesión, cambiar contraseña o deshabilitar al usuario.
- Consultar la bitácora y exportaciones para comprobar que no contienen contraseñas ni tokens.
- Para el bloqueo temporal, la prueba comprueba dos fallos `401`, el tercer fallo `423`, el rechazo de una contraseña válida y el plazo persistido de 15 minutos. Después modifica únicamente la fecha del usuario de prueba mediante SQL para verificar el desbloqueo. No hay una puerta trasera HTTP.
- Para las sesiones, se comprueba el JWT de 900 segundos, la rotación de la renovación, el límite persistido de ocho horas y el rechazo posterior a la expiración del fixture.
- La inmutabilidad se verifica tanto por ausencia de rutas de edición/eliminación como por rechazo del trigger de PostgreSQL a `UPDATE` y `DELETE` del contenido.
