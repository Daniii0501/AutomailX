import { q } from "./db";
import { isFormat, type FormatId } from "./formats";
import { clean } from "./util";

export type TopicStatus = "idea" | "scheduled" | "running" | "drafted" | "sent" | "failed";

export type Topic = {
  id: string;
  user_id: string;
  writer_id: string;
  title: string;
  notes: string;
  format: FormatId;
  scheduled_day: string | null;
  send_hour: number;
  mode: "draft" | "send";
  status: TopicStatus;
  newsletter_id: string | null;
  error: string | null;
  created_at: number;
  updated_at: number;
};

export const MAX_TOPICS = 200;

/** El día de hoy en España (YYYY-MM-DD). La programación es por día, a primera hora. */
export const madridToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });

/** La hora actual en España (0-23). */
export const madridHour = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(new Date()));

export type TopicInput = { title: string; notes: string; writerId: string; format: FormatId; day: string | null; hour: number; mode: "draft" | "send" };

export function parseTopic(b: Record<string, unknown>): TopicInput | string {
  const title = clean(b.title, 120);
  if (title.length < 3) return "Ponle un título al tema.";
  const notes = clean(b.notes, 2000);
  if (title.length + notes.length < 15) return "Añade algo más de detalle: cuanto más le cuentes, mejor escribirá.";

  let day: string | null = null;
  if (typeof b.day === "string" && b.day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.day) || Number.isNaN(Date.parse(b.day))) return "La fecha no es válida.";
    if (b.day < madridToday()) return "Elige hoy o un día futuro.";
    day = b.day;
  }
  const h = typeof b.hour === "number" ? b.hour : Number(b.hour ?? 8);
  if (!Number.isInteger(h) || h < 0 || h > 23) return "La hora no es válida.";
  const writerId = typeof b.writerId === "string" ? b.writerId : "";
  if (!writerId) return "Elige un redactor.";
  return {
    title,
    notes,
    writerId,
    format: isFormat(b.format) ? b.format : "auto",
    day,
    hour: h,
    mode: b.mode === "send" ? "send" : "draft",
  };
}

export const topicBrief = (t: { title: string; notes: string }) => `Tema: ${t.title}${t.notes ? `\n\n${t.notes}` : ""}`;

export async function listTopics(userId: string): Promise<Topic[]> {
  return q<Topic>(
    `SELECT * FROM topics WHERE user_id = ?
     ORDER BY CASE WHEN scheduled_day IS NULL THEN 1 ELSE 0 END, scheduled_day, created_at DESC`,
    [userId],
  );
}
