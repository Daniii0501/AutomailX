# AutoMailX

Contrata a tu redactor de newsletters: eliges un animal con personalidad, le cuentas tu semana
(voz o texto) y escribe la newsletter con tu estilo. Tú la apruebas y la envías.

## Qué incluye

- **Landing** con demo interactiva (elige animal → cuéntale la semana → ve cómo escribe).
- **Acceso sin contraseña**: enlace al correo (con botón de confirmación, a prueba de filtros de correo).
- **Redactores**: 6 animales con voz propia, nombre, tono, longitud, emojis y "enséñale cómo escribes".
- **Editor**: texto editable, autoguardado, "pídele cambios" (texto o voz), prueba a tu correo, envío con confirmación.
- **Audiencia**: página pública de suscripción con doble confirmación, importar correos, baja con un clic.
- **Historial**, **Ajustes**, recordatorio semanal por correo, borrar cuenta.
- **Límites** del plan gratuito en `lib/plans.ts` (ajústalos a tu gusto).

## Poner en marcha

AutoMailX necesita una base de datos **Postgres** (Supabase). Sin ella, la portada y la demo funcionan,
pero `/login` avisa de que falta conectarla.

**En Vercel (lo más fácil):** *Storage → Supabase → Create* y conéctalo a tu proyecto. Vercel añade solo
`POSTGRES_URL`. Después pulsa *Redeploy*. Las tablas se crean solas la primera vez.

**A mano:** en Supabase, *Connect → Transaction pooler*, copia la dirección y guárdala como `DATABASE_URL`
(sustituyendo `[YOUR-PASSWORD]`; si la contraseña lleva símbolos raros, hay que codificarlos).

```bash
npm install
cp .env.example .env.local   # rellena DATABASE_URL
npm run dev                  # http://localhost:3000
```

## Variables

| Qué | Variable | Para qué |
| --- | --- | --- |
| Base de datos | `DATABASE_URL` o `POSTGRES_URL` | **Obligatoria**. La integración de Supabase en Vercel la pone sola |
| Entrada de pruebas | `ALLOW_DEMO_LOGIN=1` | Muestra el enlace de acceso en pantalla (solo para probar tú sola/o) |
| Correo | `RESEND_API_KEY`, `MAIL_FROM` | Enviar enlaces de acceso y newsletters. Para escribir a otros hay que verificar un dominio en Resend |
| IA | `ANTHROPIC_API_KEY` | Que redacte Claude en vez del modo simulado |
| Recordatorio | `CRON_SECRET` | Activa el recordatorio semanal (`vercel.json` ya lo programa) |

**Importante:** `ALLOW_DEMO_LOGIN=1` permite entrar con el correo de cualquiera. Úsala solo mientras pruebas
y quítala cuando conectes el correo (Resend): entonces el enlace de acceso llega solo por email.

## Seguridad (lo que ya está hecho)

- Sesiones con cookie `HttpOnly` + `SameSite=Lax`; los tokens se guardan con hash.
- Tablas con seguridad de filas (RLS) activada: la API pública de Supabase no puede leerlas.
- Enlaces de acceso de un solo uso, 15 minutos, con límite de peticiones.
- Protección CSRF (comprobación de origen) en todo lo que modifica datos.
- Cada consulta filtra por usuario: nadie ve ni toca datos de otro.
- Todo el contenido se escapa en pantalla y en el HTML de los correos; los enlaces del botón solo admiten `http(s)`.
- Límites por usuario y por IP en IA, envíos, pruebas y suscripciones; antibots en el formulario público.
- Confirmación de suscripción y de acceso por botón (los filtros de correo no los gastan).
- La baja de un suscriptor se respeta aunque el dueño intente volver a añadirlo.

## Lo que NO incluye todavía

- Cobros (Stripe) y planes de pago: el plan Pro es solo un cartel.
- Envíos programados, imágenes con IA y estadísticas de aperturas.
- Integraciones con Teams / Google Calendar (la entrada de contenido es voz o texto).
- Los textos legales (`/privacidad`, `/terminos`) son **borradores**: revísalos con un profesional.

## Estructura

```
app/                 páginas y API (Next.js)
  api/               rutas del servidor
  panel/             la app (inicio, editor, audiencia, historial, ajustes)
components/          Animal (avatares SVG), Demo, Editor, Composer...
lib/                 base de datos, auth, IA, correo, animales, límites
```
