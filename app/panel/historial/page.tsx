import Link from "next/link";
import WriterAvatar from "@/components/WriterAvatar";
import { requireUser } from "@/lib/auth";
import type { NewsletterRow } from "@/lib/data";
import { eq, select } from "@/lib/db";
import { fecha, plural } from "@/lib/format-utils";
import { DEFAULT_LOOK } from "@/lib/newsletter";

type Row = Pick<NewsletterRow, "id" | "look" | "content" | "status" | "recipients" | "delivery" | "created_at" | "sent_at">;

export default async function HistoryPage() {
  const user = await requireUser();
  const rows = await select<Row>("newsletters", { select: "id,look,content,status,recipients,delivery,created_at,sent_at", user_id: eq(user.id), order: "created_at.desc", limit: 100 });
  const drafts = rows.filter((r) => r.status === "draft");
  const sent = rows.filter((r) => r.status !== "draft");

  const Item = ({ r }: { r: Row }) => (
    <li>
      <Link href={`/panel/n/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7]">
        <WriterAvatar look={r.look?.color ? r.look : DEFAULT_LOOK} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{r.content.subject}</span>
          <span className="text-xs text-muted">
            {r.status === "draft"
              ? `Borrador · ${fecha(r.created_at)}`
              : r.status === "sending"
                ? "Enviándose…"
                : `Enviada el ${fecha(r.sent_at)} a ${plural(r.recipients, "persona", "personas")}${r.delivery === "demo" ? " (modo prueba)" : ""}`}
          </span>
        </span>
        <span aria-hidden className="text-muted">›</span>
      </Link>
    </li>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial</h1>
        <p className="mt-1 text-muted">Tus borradores y todo lo que has enviado.</p>
      </div>
      {rows.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-muted">Aún no has escrito ninguna newsletter.</p>
          <Link href="/panel" className="btn btn-primary mt-4">Escribir la primera</Link>
        </div>
      )}
      {drafts.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">Borradores ({drafts.length})</h2>
          <ul className="card divide-y divide-line overflow-hidden">{drafts.map((r) => <Item key={r.id} r={r} />)}</ul>
        </section>
      )}
      {sent.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">Enviadas ({sent.length})</h2>
          <ul className="card divide-y divide-line overflow-hidden">{sent.map((r) => <Item key={r.id} r={r} />)}</ul>
        </section>
      )}
    </div>
  );
}
