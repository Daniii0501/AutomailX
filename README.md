# AutoMailX

Contrata a tu redactor de newsletters: eliges un animal con personalidad, le cuentas tu semana
(voz o texto) y escribe la newsletter con tu estilo. Tú la apruebas y la envías.

## Qué incluye

- **Landing** con demo interactiva (elige animal → cuéntale la semana → ve cómo escribe).
- **Acceso sin contraseña**: enlace al correo (con botón de confirmación, a prueba de filtros de correo).
- **Redactores**: 6 animales con voz propia **o un copywriter a medida** (cara, color, voz, público, lo que siempre/nunca hace,
  expresiones, saludo y despedida propios, humor, emoción, idioma, textos de ejemplo para copiar tu estilo).
- **10 estilos de copy** por newsletter: historia, venta, humor, enseñar algo, novedades, carta personal, resumen, opinión,
  caso de éxito, lanzamiento (o "que decida el redactor"). Cada redactor tiene uno por defecto.
- **Motor de redacción**: reglas de oficio (gancho, asunto, ritmo, lista de clichés prohibidos, veracidad), plan previo,
  segundo pase de "editor jefe" y aviso de cifras que no estaban en tus notas.
- **Temas**: banco de ideas; cada tema lleva redactor, estilo, notas y un día. Ese día se escribe solo y te avisa por correo
  (o se envía solo, si lo pides).
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
| Recordatorio y Temas | `CRON_SECRET` | Activa el recordatorio semanal y la escritura diaria de los temas programados (`vercel.json` ya los programa) |
| Modelo de IA | `ANTHROPIC_MODEL` | Opcional. Por defecto `claude-sonnet-5-5`; un modelo más potente escribe mejor y cuesta más |
| Editor jefe | `AI_POLISH=0` | Opcional. Apaga el segundo pase de pulido (gasta la mitad, escribe peor) |

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

## Calidad de la redacción

Sin `ANTHROPIC_API_KEY` el borrador lo hace un modo simulado que solo reordena tus frases: **no sabe escribir** y el editor
lo avisa. La calidad real solo existe con la IA conectada. Cada newsletter hace dos llamadas (redactor + editor jefe).
La demo de la portada usa ejemplos escritos a mano (`lib/showcase.ts`), así que no gasta IA.
Para afinar el estilo, los prompts están en `lib/formats.ts` (reglas de oficio y estilos) y `lib/ai.ts` (voz del redactor).

## Temas programados

La programación es **por día**: el cron de Vercel gratis se ejecuta una vez al día (06:30 UTC, a primera hora en España).
Los temas cuyo día ya llegó se escriben entonces; si un día falla, se recuperan en la siguiente ejecución.

## Lo que NO incluye todavía

- Cobros (Stripe) y planes de pago: el plan Pro es solo un cartel.
- Programación por hora (solo por día), imágenes con IA y estadísticas de aperturas.
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
