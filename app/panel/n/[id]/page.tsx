import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CampaignStats from "@/components/CampaignStats";
import Editor from "@/components/Editor";
import { requireUser } from "@/lib/auth";
import { getNewsletter, getPublication } from "@/lib/data";
import { count, eq } from "@/lib/db";
import { mailEnabled } from "@/lib/email";
import { FORMATS } from "@/lib/formats";
import { DEFAULT_LOOK } from "@/lib/newsletter";
import { campaignStats, topLinks } from "@/lib/stats";
import { webhookConfigured } from "@/lib/webhook";

type P = Promise<{ id: string }>;

export default async function NewsletterPage({ params }: { params: P }) {
  const user = await requireUser();
  const { id } = await params;
  const n = await getNewsletter(user.id, id);
  if (!n) notFound();
  const [pub, confirmed, h] = await Promise.all([
    getPublication(user.id),
    count("subscribers", { user_id: eq(user.id), status: eq("confirmed") }),
    headers(),
  ]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const site = process.env.APP_URL || `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const [stat, links] =
    n.status === "sent" ? await Promise.all([campaignStats(user.id, n.sent_at).then((l) => l.find((x) => x.id === n.id) ?? null), topLinks(n.id)]) : [null, []];

  return (
    <Editor
      results={stat ? <CampaignStats c={stat} links={links} tracking={webhookConfigured()} /> : null}
      key={n.updated_at}
      id={n.id}
      initial={n.content}
      status={n.status}
      warnings={n.warnings ?? []}
      look={n.look?.color ? n.look : DEFAULT_LOOK}
      confirmed={confirmed}
      publicationName={pub.name}
      senderName={pub.sender_name}
      replyTo={pub.reply_to}
      siteUrl={site}
      mailOn={mailEnabled()}
      sentAt={n.sent_at}
      recipients={n.recipients}
      delivery={n.delivery}
      formatLabel={(FORMATS[n.format] ?? FORMATS.auto).label}
    />
  );
}
