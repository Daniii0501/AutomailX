export type ApiResult<T> = { ok: boolean; status: number; data: T & { error?: string } };

/** fetch JSON sencillo para los componentes de cliente. */
export async function api<T = Record<string, unknown>>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  data?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, status: res.status, data: json };
  } catch {
    return { ok: false, status: 0, data: { error: "Sin conexión. Inténtalo de nuevo." } as T & { error?: string } };
  }
}
