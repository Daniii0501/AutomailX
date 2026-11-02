import { createHash, randomBytes } from "node:crypto";

export { esc } from "./esc";

export const newToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export const normEmail = (s: unknown) => (typeof s === "string" ? s.trim().toLowerCase() : "");
export const isEmail = (s: string) => s.length <= 254 && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i.test(s);

const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
/** Texto limpio y recortado (o "" si no es texto). */
export const clean = (x: unknown, max: number) => (typeof x === "string" ? x.replace(CTRL, "").trim().slice(0, max) : "");

export const int = (x: unknown, min: number, max: number, fallback: number) => {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

export function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "newsletter"
  );
}

export { isUuid, fecha, plural } from "./format-utils";
