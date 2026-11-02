"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl" aria-hidden>🙈</p>
      <h1 className="mt-3 text-2xl font-bold">Algo ha fallado</h1>
      <p className="mt-2 text-muted">No es culpa tuya. Vuelve a intentarlo; si sigue pasando, espera un minuto.</p>
      <button onClick={reset} className="btn btn-primary mt-6">Reintentar</button>
    </main>
  );
}
