// Servidor SOLO para pruebas en local: imita el subconjunto de la API de Supabase (PostgREST)
// que usa lib/db.ts, sobre un Postgres local. No se despliega.
//   DATABASE_URL=postgres://... PORT=3999 node dev/mock-postgrest.mjs
import http from "node:http";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? "postgres://postgres@localhost/amx", {
  types: { date: { to: 1082, from: [1082], serialize: (x) => x, parse: (x) => x } },
  onnotice: () => {},
});
const KEY = process.env.MOCK_KEY ?? "local-secret";

const OPS = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" };

function filterFrag(col, raw) {
  let neg = false;
  let v = raw;
  if (v.startsWith("not.")) {
    neg = true;
    v = v.slice(4);
  }
  const dot = v.indexOf(".");
  const op = v.slice(0, dot);
  const val = v.slice(dot + 1);
  let f;
  if (op === "is") f = val === "null" ? sql`${sql(col)} is null` : sql`${sql(col)} is ${sql.unsafe(val === "true" ? "true" : "false")}`;
  else if (op === "in") {
    const items = val.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, ""));
    f = sql`${sql(col)}::text in ${sql(items)}`;
  } else if (OPS[op]) f = sql`${sql(col)} ${sql.unsafe(OPS[op])} ${val}`;
  else throw Object.assign(new Error(`operador no soportado: ${op}`), { status: 400 });
  return neg ? sql`not (${f})` : f;
}

function parseQuery(sp) {
  const filters = [];
  let select = "*";
  let order = null;
  let limit = null;
  let offset = null;
  let onConflict = null;
  for (const [k, v] of sp) {
    if (k === "select") select = v;
    else if (k === "order") order = v;
    else if (k === "limit") limit = Number(v);
    else if (k === "offset") offset = Number(v);
    else if (k === "on_conflict") onConflict = v;
    else filters.push(filterFrag(k, v));
  }
  const where = filters.length ? sql`where ${filters.reduce((a, f) => sql`${a} and ${f}`)}` : sql``;
  const cols = select === "*" ? sql`*` : sql(select.split(",").map((s) => s.trim()));
  const ord = order
    ? sql`order by ${sql.unsafe(
        order
          .split(",")
          .map((o) => {
            const [c, dir, nulls] = o.split(".");
            if (!/^[a-z_]+$/.test(c)) throw new Error("orden no válido");
            return `"${c}" ${dir === "desc" ? "desc" : "asc"}${nulls === "nullslast" ? " nulls last" : nulls === "nullsfirst" ? " nulls first" : ""}`;
          })
          .join(", "),
      )}`
    : sql``;
  const lim = limit !== null ? sql`limit ${limit}` : sql``;
  const off = offset !== null ? sql`offset ${offset}` : sql``;
  return { where, cols, ord, lim, off, onConflict };
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const t = Buffer.concat(chunks).toString();
  return t ? JSON.parse(t) : null;
}

const send = (res, status, data, headers = {}) => {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(data === undefined ? "" : JSON.stringify(data));
};

// Las columnas jsonb deben ir como json, no como texto.
let jsonCols = null;
async function jsonColumns() {
  if (!jsonCols) {
    const rows = await sql`select table_name, column_name from information_schema.columns where table_schema='public' and data_type in ('jsonb','json')`;
    jsonCols = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
  }
  return jsonCols;
}
async function prep(table, row) {
  const jc = await jsonColumns();
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k] = jc.has(`${table}.${k}`) && v !== null ? sql.json(v) : v;
  return out;
}

http
  .createServer(async (req, res) => {
    try {
      if (req.headers.apikey !== KEY) return send(res, 401, { message: "Invalid API key" });
      const u = new URL(req.url, "http://x");
      const m = u.pathname.match(/^\/rest\/v1\/(rpc\/)?([a-z_]+)$/);
      if (!m) return send(res, 404, { message: "not found" });
      const [, isRpc, name] = m;
      const prefer = String(req.headers.prefer ?? "");

      if (isRpc) {
        const args = (await readBody(req)) ?? {};
        const keys = Object.keys(args);
        const call = keys.length
          ? sql`select ${sql.unsafe(`public.${name}`)}(${keys.map((k, i) => sql`${sql.unsafe(k)} => ${args[k]}`).reduce((a, f) => sql`${a}, ${f}`)}) as r`
          : sql`select ${sql.unsafe(`public.${name}`)}() as r`;
        const [row] = await call;
        return send(res, 200, row.r);
      }

      const t = sql(name);
      const q = parseQuery(u.searchParams);

      if (req.method === "GET" || req.method === "HEAD") {
        const rows = await sql`select ${q.cols} from ${t} ${q.where} ${q.ord} ${q.lim} ${q.off}`;
        const headers = {};
        if (prefer.includes("count=exact")) {
          const [{ n }] = await sql`select count(*)::int as n from ${t} ${q.where}`;
          headers["content-range"] = `${rows.length ? `0-${rows.length - 1}` : "*"}/${n}`;
        }
        return send(res, 200, [...rows], headers);
      }
      if (req.method === "POST") {
        const body = await readBody(req);
        const list = Array.isArray(body) ? body : [body];
        const out = [];
        for (const r of list) {
          const row = await prep(name, r);
          const cols = Object.keys(row);
          let conflict = sql``;
          if (prefer.includes("resolution=ignore-duplicates")) conflict = sql`on conflict ${q.onConflict ? sql`(${sql(q.onConflict.split(","))})` : sql``} do nothing`;
          else if (prefer.includes("resolution=merge-duplicates"))
            conflict = sql`on conflict (${sql(q.onConflict.split(","))}) do update set ${sql(row, cols)}`;
          const rows = await sql`insert into ${t} ${sql(row, cols)} ${conflict} returning *`;
          out.push(...rows);
        }
        return send(res, 201, out);
      }
      if (req.method === "PATCH") {
        const row = await prep(name, await readBody(req));
        const rows = await sql`update ${t} set ${sql(row, Object.keys(row))} ${q.where} returning *`;
        return send(res, 200, [...rows]);
      }
      if (req.method === "DELETE") {
        const rows = await sql`delete from ${t} ${q.where} returning *`;
        return send(res, 200, [...rows]);
      }
      return send(res, 405, { message: "method" });
    } catch (e) {
      const status = e.code === "23505" ? 409 : e.status ?? 400;
      return send(res, status, { code: e.code, message: e.message });
    }
  })
  .listen(Number(process.env.PORT ?? 3999), () => console.log("mock postgrest listo"));
