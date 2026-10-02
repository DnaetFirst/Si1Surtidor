# Despliegue de demostración y preparación para Railway

## Demostración gratuita: Render y Neon

La demostración utiliza un único Web Service **Free** de Render para Apache, React y NestJS, y un proyecto **Free** de Neon con PostgreSQL 15. Es una adaptación del proveedor Railway indicado en el PDF para cumplir el requisito de coste cero. Los límites gratuitos son compartidos con otros proyectos de la cuenta. Render suspende el servicio tras 15 minutos de inactividad y el siguiente acceso puede tardar aproximadamente un minuto.

- Repositorio: `DnaetFirst/Si1Surtidor`, rama `main`.
- Runtime Docker, contexto raíz y Dockerfile `infrastructure/demo.Dockerfile`.
- Puerto público `10000`; comprobación de salud `/api/health`.
- `DATABASE_URL`: conexión de Neon con verificación TLS; `DATABASE_SSL=true`.
- `JWT_SECRET`, `CSRF_SECRET` y las variables `BOOTSTRAP_*`: secretos de esta instalación, configurados en Render, nunca en Git.
- `COOKIE_SECURE=true`, `TRUST_PROXY=true`. El origen se obtiene de `RENDER_EXTERNAL_URL`; `WEB_ORIGIN` permite reemplazarlo para un dominio propio.

El proceso de inicio aplica migraciones e inicializa solamente ASU y ATI en una base vacía, inicia la API en `127.0.0.1:3000` y Apache en el puerto público. Apache sirve el frontend y reenvía `/api` bajo el mismo dominio. Ambos procesos se supervisan; si uno falla, el contenedor termina para que la plataforma pueda reiniciarlo. Los datos persisten en Neon aunque Render se suspenda o reinicie.

No seleccionar planes de pago, discos persistentes ni otros complementos. La disponibilidad está sujeta a las cuotas gratuitas: [Render](https://render.com/docs/free), [Neon](https://neon.com/pricing). No se promete disponibilidad continua para producción.

## Alternativa original: Railway

El repositorio incluye dos imágenes independientes. La publicación y contratación de servicios no se han realizado.

## Servicios

1. PostgreSQL: provisionar PostgreSQL 15 y conservar copias de seguridad.
2. API: construir desde `infrastructure/api.Dockerfile`, con contexto en la raíz del repositorio. Escucha en `PORT` (3000 por defecto). La comprobación de salud es `/api/health`.
3. Web: construir desde `infrastructure/web.Dockerfile`, con contexto en la raíz. Apache escucha en el puerto 80; configurar ese puerto como destino del dominio público de Railway.

## Variables

API: `DATABASE_URL`, `JWT_SECRET`, `CSRF_SECRET`, `BOOTSTRAP_ASU_EMAIL`, `BOOTSTRAP_ASU_PASSWORD`, `BOOTSTRAP_ATI_EMAIL`, `BOOTSTRAP_ATI_PASSWORD`, `WEB_ORIGIN`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`. Los secretos deben tener al menos 32 caracteres. `WEB_ORIGIN` es la URL HTTPS pública del frontend, sin barra final. Configurar `DATABASE_SSL=true` solo cuando la conexión PostgreSQL requiera TLS con certificado verificable.

Web: `API_UPSTREAM` debe apuntar a la URL privada de la API; por ejemplo, `http://api.railway.internal:3000`, reemplazando el nombre por el asignado al servicio. Apache publica `/api` bajo el mismo origen del frontend para que las cookies funcionen sin acceso entre dominios.

Las credenciales de bootstrap solo se usan para crear las cuentas iniciales cuando la tabla de usuarios está vacía. Ejecutar de nuevo el seed no las restablece. No usar `.env` ni `.local/ACCESO.txt` de desarrollo como archivos públicos.

La inicialización crea exactamente dos usuarios: ASU y ATI. Sus identificadores y nombres pueden configurarse con `BOOTSTRAP_ASU_CI`, `BOOTSTRAP_ASU_NAME`, `BOOTSTRAP_ATI_CI` y `BOOTSTRAP_ATI_NAME`. Los otros tres roles se registran sin cuentas. Una base existente no se vacía ni se modifica para forzar este número de usuarios.

## Secuencia de entrega

Ejecutar `npm test` sobre PostgreSQL 15 antes de construir las imágenes. La imagen API aplica migraciones al iniciar y arranca solo si terminan correctamente; el esquema no utiliza `synchronize`. En la primera entrega mantener una réplica API mientras se aplican migraciones. Para futuras versiones, ejecutar migraciones como paso único previo al despliegue.

Validar `/api/health`, login, persistencia después de reiniciar, cookies Secure/HttpOnly, rechazo CSRF, permisos de los actores y exportación de bitácora. Conservar una copia de seguridad antes de futuros cambios de esquema. El downgrade destructivo está deshabilitado; una reversión requiere restauración explícita de la copia correspondiente.

## Observación

La API expone salud de conexión y errores sanitizados; los eventos de autenticación y operaciones administrativas quedan en bitácora. Para producción con múltiples réplicas, el límite adicional por IP debe moverse del proceso a un almacén compartido. El bloqueo de tres intentos por cuenta ya es persistente y compartido en PostgreSQL.
