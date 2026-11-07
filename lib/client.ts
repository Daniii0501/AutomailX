/** Error de nuestra API, con el cuerpo de la respuesta (p. ej. `upsell: true`). */
export class ApiError extends Error {
  constructor(message: string, public data: Record<string, unknown>) {
    super(message);
  }
}

/** Llamada a nuestra API desde el navegador. Devuelve los datos o lanza un Error con un mensaje claro. */
export async function api<T = Record<string, unknown>>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: { "content-type": "application/json", accept: "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new Error("Sin conexión. Revisa tu internet y vuelve a intentarlo.");
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* respuesta vacía o no JSON */
  }
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Tu sesión ha caducado.");
  }
  if (!res.ok) throw new ApiError(typeof data.error === "string" ? data.error : `Algo ha fallado (${res.status}). Vuelve a intentarlo.`, data);
  return data as T;
}
