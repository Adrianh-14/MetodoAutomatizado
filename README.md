# MetodoAutomatizado

Aplicación preparada para desplegarse en Dokploy con Docker Compose.

## Despliegue en Dokploy

1. Crea un servicio **Compose** y selecciona el tipo **Docker Compose** (no Stack).
2. Conecta el repositorio y configura la ruta Compose como `./panel/docker-compose.yml`.
3. Activa **Isolated Deployments** si está disponible.
4. Copia las variables de `panel/.env.example` al apartado **Environment** de Dokploy y reemplaza todos los valores `replace-with-...`.
5. Despliega el servicio.
6. En **Domains**, agrega el dominio al servicio `frontend` usando el puerto de contenedor `4173`.

No se publican puertos directamente en el host. El frontend usa exclusivamente `4173`; no usa `80`, `8080` ni `3000`. PostgreSQL (`5432`), backend (`3001`) y automatización (`3002`) sólo son accesibles dentro de la red privada del Compose.

## Variables importantes

- `POSTGRES_PASSWORD`: contraseña aleatoria de PostgreSQL.
- `DATABASE_URL`: `postgresql://metodo:CONTRASENA@postgres:5432/metodo_db?schema=public`.
- `DATABASE_URL_UNPOOLED`: puede tener el mismo valor en este despliegue.
- `JWT_SECRET` y `JWT_REFRESH_SECRET`: secretos diferentes de al menos 32 caracteres.
- `FRONTEND_URL`: URL pública exacta, por ejemplo `https://panel.example.com`.
- `AUTOMATION_API_KEY`: clave interna aleatoria para comunicar backend y Playwright.
- `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD`: acceso administrador inicial.
- `SEED_DEMO_DATA=false`: evita crear los 500 registros de demostración.

Para generar secretos en un servidor Linux:

```bash
openssl rand -hex 32
```

Si la contraseña de PostgreSQL contiene caracteres reservados de URL, debe codificarse al construir `DATABASE_URL`. Una cadena hexadecimal evita ese problema.

## Persistencia

- `postgres_data`: base de datos PostgreSQL.
- `automation_data`: perfiles cargados y capturas de error de Playwright.

Ambos son volúmenes nombrados, compatibles con las copias de seguridad de volúmenes de Dokploy.

## Seguridad antes de publicar

El archivo `panel/ProyectoMosivo Auto'/config.json` contiene credenciales en texto plano y ya figura en el historial de Git. Está excluido de las nuevas imágenes Docker, pero debe retirarse del repositorio y de su historial antes de compartirlo o desplegar desde un repositorio público. También deben rotarse las credenciales expuestas. La reescritura del historial no se realiza automáticamente porque afecta a todos los clones del repositorio.

La automatización pública pasa por Nginx, el JWT de un administrador y una clave interna; el contenedor de Playwright no queda publicado directamente.

## Comprobación local

```bash
cd panel
cp .env.example .env
docker compose up --build
```

La entrada se atiende en el puerto interno `4173`. Para acceso desde el host durante desarrollo, crea un override local que publique un puerto disponible; el Compose de producción evita intencionalmente cualquier binding al host.
