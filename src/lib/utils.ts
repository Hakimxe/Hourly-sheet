// Format YYYY-MM-DD in local time
export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Current month string YYYY-MM
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function daysInMonth(monthStr: string): number {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

// Returns first weekday (0=Sun..6=Sat) of the month
export function firstWeekdayOfMonth(monthStr: string): number {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}

export function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatStartedOn(iso: string): string {
  // iso is "YYYY-MM-DD HH:MM:SS" from SQLite (UTC)
  const safe = iso.includes("T") ? iso : iso.replace(" ", "T") + "Z";
  const d = new Date(safe);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function startedOnYmd(iso: string): string {
  const safe = iso.includes("T") ? iso : iso.replace(" ", "T") + "Z";
  const d = new Date(safe);
  return ymd(d);
}

export function countryFlag(country: string): string {
  // Map common country names to flags (extend as needed)
  const map: Record<string, string> = {
    indonesia: "🇮🇩",
    morocco: "🇲🇦",
    "united states": "🇺🇸",
    usa: "🇺🇸",
    "united kingdom": "🇬🇧",
    uk: "🇬🇧",
    france: "🇫🇷",
    germany: "🇩🇪",
    spain: "🇪🇸",
    italy: "🇮🇹",
    portugal: "🇵🇹",
    brazil: "🇧🇷",
    argentina: "🇦🇷",
    mexico: "🇲🇽",
    canada: "🇨🇦",
    india: "🇮🇳",
    china: "🇨🇳",
    japan: "🇯🇵",
    "south korea": "🇰🇷",
    philippines: "🇵🇭",
    vietnam: "🇻🇳",
    thailand: "🇹🇭",
    malaysia: "🇲🇾",
    singapore: "🇸🇬",
    australia: "🇦🇺",
    "new zealand": "🇳🇿",
    egypt: "🇪🇬",
    "south africa": "🇿🇦",
    nigeria: "🇳🇬",
    kenya: "🇰🇪",
    turkey: "🇹🇷",
    "saudi arabia": "🇸🇦",
    uae: "🇦🇪",
    "united arab emirates": "🇦🇪",
    russia: "🇷🇺",
    poland: "🇵🇱",
    netherlands: "🇳🇱",
    belgium: "🇧🇪",
    sweden: "🇸🇪",
    norway: "🇳🇴",
    denmark: "🇩🇰",
    finland: "🇫🇮",
    ireland: "🇮🇪",
    pakistan: "🇵🇰",
    bangladesh: "🇧🇩",
  };
  return map[country.trim().toLowerCase()] ?? "🌍";
}
