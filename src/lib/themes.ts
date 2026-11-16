/**
 * The monthly focus. Felisa's list, 2026-11-12.
 *
 * Each theme is announced at the Common Bridge summit on the third Thursday
 * of the month before; ambassadors can start right away. The public site
 * switches on the 1st of the theme's month (Eastern time).
 */

export interface MonthlyTheme {
  month: string; // YYYY-MM
  title: string;
}

export const THEMES: MonthlyTheme[] = [
  { month: "2026-12", title: "What is a Bridge Builder?" },
  { month: "2027-01", title: "Disagreeing Without Disconnecting" },
  { month: "2027-02", title: "Persuasive Conversations as Opportunities for Positive Impact" },
  { month: "2027-03", title: "Self-Censorship and Speaking Up Respectfully" },
  { month: "2027-04", title: "Disagreement in Friendships and Groups" },
  { month: "2027-05", title: "Social Media's Effect on How We Listen and Learn" },
  { month: "2027-06", title: "Finding Common Ground in Diverse Spaces" },
];

/** YYYY-MM for a moment, in Eastern time. */
export function easternMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

/** The theme for this month, or undefined before the first one starts. */
export function currentTheme(now: Date = new Date()): MonthlyTheme | undefined {
  const key = easternMonth(now);
  return THEMES.find((t) => t.month === key);
}

/** Month name for a theme, e.g. "December". */
export function themeMonthName(t: MonthlyTheme): string {
  const [y, m] = t.month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}
