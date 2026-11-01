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

## Arrancar en tu ordenador

```bash
npm install
npm run dev        # http://localhost:3000
```

Sin ninguna clave funciona en **modo demo**: el enlace de acceso se muestra en pantalla, la IA es
simulada y los correos no se envían. Los datos se guardan en `data/automailx.db`.

## Pasar a producción (todo opcional, de uno en uno)

Copia `.env.example` a `.env.local` (o, en Vercel, *Settings → Environment Variables*):

| Qué | Variable | Para qué |
| --- | --- | --- |
| Base de datos | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Que los datos se guarden de verdad |
| Correo | `RESEND_API_KEY`, `MAIL_FROM` | Enviar enlaces de acceso y newsletters. Hay que verificar un dominio en Resend |
| IA | `ANTHROPIC_API_KEY` | Que redacte Claude en vez del modo simulado |
| Recordatorio | `CRON_SECRET` | Activa el recordatorio semanal (`vercel.json` ya lo programa) |

**Importante:** en cuanto pones `RESEND_API_KEY` o la base de datos, el enlace de acceso deja de
mostrarse en pantalla y solo llega por correo. Es la protección que impide que cualquiera entre
con el correo de otro.

## Seguridad (lo que ya está hecho)

- Sesiones con cookie `HttpOnly` + `SameSite=Lax`; los tokens se guardan con hash.
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
