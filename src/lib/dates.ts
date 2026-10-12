// Date helpers. The prototype uses a fixed "today" so seeded expiry buckets
// stay stable regardless of when the demo is viewed.
export const TODAY = new Date("2026-10-12T09:00:00Z");

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function daysUntil(dateIso: string, from: Date = TODAY): number {
  const d = new Date(dateIso);
  return Math.round((d.getTime() - from.getTime()) / MS_PER_DAY);
}

export function daysSince(dateIso: string, from: Date = TODAY): number {
  return -daysUntil(dateIso, from);
}

export function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function fmtDate(dateIso: string | null): string {
  if (!dateIso) return "—";
  return new Date(dateIso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(dateIso: string): string {
  return new Date(dateIso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(dateIso: string, from: Date = TODAY): string {
  const diff = Math.round((new Date(dateIso).getTime() - from.getTime()) / MS_PER_DAY);
  if (diff === 0) return "today";
  if (diff === -1) return "yesterday";
  if (diff === 1) return "tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `in ${diff}d`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
