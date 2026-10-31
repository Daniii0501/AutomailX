# AutoMailX 

Cuenta tu semana por voz y obtén tu newsletter lista para enviar.
Esta es la **fase 1**: landing + demo interactiva "voz → newsletter".

## Arrancar

```bash
npm install
cp .env.example .env.local   # opcional: añade tu ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Sin `ANTHROPIC_API_KEY` la demo usa un generador simulado que solo reordena lo que dices
(no inventa datos). Con la clave, redacta Claude.

## Qué hay

- `app/page.tsx` — landing.
- `components/Demo.tsx` — demo en marco de móvil (voz con Web Speech API, o texto), generación animada y botón de envío **simulado**.
- `app/api/generate/route.ts` — convierte la nota en newsletter (Claude o simulado).
- `lib/newsletter.ts` — tipos, tonos y generador simulado.

## Notas

- El reconocimiento de voz usa la Web Speech API: funciona en Chrome/Edge/Safari; en Firefox la demo ofrece escribir.
- El botón "Enviar ahora" no envía nada: es demo.

## Siguientes fases

1. Cuentas (Supabase) y guardar perfil del agente (tono, ejemplos, plantillas).
2. Envío real con Resend y gestión de suscriptores.
3. Lista de espera conectada y analítica de la demo.
4. Fuentes de contenido: Google Calendar y transcripciones.
