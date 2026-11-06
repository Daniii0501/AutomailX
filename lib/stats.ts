import "server-only";
import { eq, rpc, select } from "./db";
import type { Look } from "./newsletter";

export type CampaignStat = {
  id: string;
  subject: string;
  sent_at: string;
  recipients: number;
  delivery: string | null;
  look: Look;
  tracked: number; // correos con seguimiento (enviados por Resend y registrados)
  delivered: number;
  opened: number; // personas únicas que abrieron
  clicked: number; // personas únicas que hicieron clic
  bounced: number;
  complained: number;
  total_opens: number;
  total_clicks: number;
  unsubscribed: number;
};

export type Week = { week: string; joined: number; left: number };

export const PERIODS = { "30": 30, "90": 90, todo: null } as const;
export type Period = keyof typeof PERIODS;
export const isPeriod = (x: unknown): x is Period => typeof x === "string" && x in PERIODS;

export function sinceOf(p: Period): string | null {
  const days = PERIODS[p];
  return days ? new Date(Date.now() - days * 86400_000).toISOString() : null;
}

export async function campaignStats(userId: string, since: string | null): Promise<CampaignStat[]> {
  return (await rpc<CampaignStat[]>("amx_campaign_stats", { p_user: userId, p_since: since })) ?? [];
}

export async function growth(userId: string, weeks = 12): Promise<Week[]> {
  return (await rpc<Week[]>("amx_growth", { p_user: userId, p_weeks: weeks })) ?? [];
}

export async function topLinks(newsletterId: string, limit = 5): Promise<{ url: string; clicks: number }[]> {
  return select("link_clicks", { select: "url,clicks", newsletter_id: eq(newsletterId), order: "clicks.desc", limit });
}

/** Base para las tasas: entregados si ya hay datos de entrega; si no, los enviados con seguimiento. */
export const baseOf = (c: Pick<CampaignStat, "delivered" | "tracked">) => (c.delivered > 0 ? c.delivered : c.tracked);

/** Tasa (0–1) o null si no hay base. */
export const rate = (num: number, den: number): number | null => (den > 0 ? Math.min(1, num / den) : null);

export const pct = (r: number | null, digits = 0) =>
  r === null ? "—" : `${(r * 100).toLocaleString("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;

export function totals(list: CampaignStat[]) {
  const t = { campaigns: list.length, sent: 0, tracked: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, unsubscribed: 0 };
  for (const c of list) {
    t.sent += c.recipients;
    t.tracked += c.tracked;
    t.delivered += c.delivered;
    t.opened += c.opened;
    t.clicked += c.clicked;
    t.bounced += c.bounced;
    t.complained += c.complained;
    t.unsubscribed += c.unsubscribed;
  }
  return t;
}
