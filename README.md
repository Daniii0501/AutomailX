# AutoMailX

Contrata a un redactor de IA con personalidad, cuéntale tu semana y envía a tu lista una newsletter que la gente sí abre.

## Cómo está hecho

- **Next.js 16** (App Router, TypeScript, Tailwind 4), **Node 22** fijado en `package.json`.
- **Supabase** como base de datos, usada **por HTTP** (su API REST) con la clave secreta del servidor.
  No hay conexiones Postgres que mantener abiertas: cada consulta es una petición corta con timeout.
- **El esquema vive en `supabase/migrations/`** y se aplica una vez. La web nunca crea ni cambia tablas.
- **IA para redactar**: Claude (SDK oficial `@anthropic-ai/sdk`) u OpenAI (SDK oficial `openai`), según
  qué clave haya en Vercel. Si están las dos, manda Claude. Un pase de redactor y otro de editor jefe,
  con salida JSON validada.
- **Resend** para el correo. Doble confirmación de suscriptores y baja en un clic.
- Entrada sin contraseñas: enlace mágico (15 min, un solo uso, se canjea con un botón para que los
  antivirus del correo no lo gasten). Los formularios de entrada, suscripción y baja funcionan aunque
  falle el JavaScript.

## Carpetas

```
app/            páginas y rutas de la API
components/     piezas de interfaz
lib/            lógica: db, auth, ai, email, send, topics...
supabase/       migraciones SQL
dev/            servidor de pruebas local (no se despliega)
```

## Variables

Mira `.env.example`. `GET /api/health` te dice qué está conectado y qué falta.

## Probar en local

Con un Postgres local con la migración aplicada:

```bash
DATABASE_URL=postgres://postgres:pg@127.0.0.1/amx node dev/mock-postgrest.mjs &
SUPABASE_URL=http://localhost:3999 SUPABASE_SERVICE_ROLE_KEY=local-secret ALLOW_DEMO_LOGIN=1 CRON_SECRET=x npm run dev
```

`dev/mock-postgrest.mjs` imita la parte de la API de Supabase que usa la app.

## Temas a una hora exacta

En Vercel Hobby los crons son diarios (06:30 UTC). Para que la hora elegida se respete, crea en
[cron-job.org](https://cron-job.org) una tarea cada hora que llame a `https://TU-WEB/api/cron/topics`
con la cabecera `Authorization: Bearer TU_CRON_SECRET`.
