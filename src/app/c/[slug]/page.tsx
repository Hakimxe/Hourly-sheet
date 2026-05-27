"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Logo from "@/components/Logo";
import {
  countryFlag,
  currentMonth,
  daysInMonth,
  firstWeekdayOfMonth,
  monthLabel,
  shiftMonth,
  ymd,
} from "@/lib/utils";

type Creator = {
  id: number;
  name: string;
  country: string;
  slug: string;
  status: "active" | "paused";
};

type Entry = {
  id: number;
  creator_id: number;
  date: string;
  hours: number;
  videos: number;
  locked: number;
};

export default function CreatorPublicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState<string>(currentMonth());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openDate, setOpenDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/public/${slug}?month=${month}`, {
      cache: "no-store",
    });
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setCreator(data.creator);
      setEntries(data.entries);
    }
    setLoading(false);
  }, [slug, month]);

  useEffect(() => {
    load();
  }, [load]);

  const entryByDate = useMemo(() => {
    const m = new Map<string, Entry>();
    for (const e of entries) m.set(e.date, e);
    return m;
  }, [entries]);

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        hours: acc.hours + Number(e.hours),
        videos: acc.videos + Number(e.videos),
        days: acc.days + 1,
      }),
      { hours: 0, videos: 0, days: 0 }
    );
  }, [entries]);

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center max-w-sm animate-fade-in-up">
          <div className="h-14 w-14 rounded-2xl bg-orange-100 grid place-items-center mx-auto mb-4 text-2xl">
            🔗
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Link not found</h1>
          <p className="text-sm text-slate-500 mt-2">
            This link doesn&apos;t exist anymore. Please check with your manager.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !creator) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  const isPaused = creator?.status === "paused";
  const totalDays = daysInMonth(month);
  const firstDow = firstWeekdayOfMonth(month);
  const today = ymd(new Date());

  const dayCells: ({ day: number; date: string; future: boolean } | null)[] = [];
  for (let i = 0; i < firstDow; i++) dayCells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const [y, m] = month.split("-").map(Number);
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayCells.push({ day: d, date, future: date > today });
  }

  return (
    <div className="min-h-screen bg-orange-50/30">
      {/* Hero */}
      <header className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white overflow-hidden">
        {/* Decorative orbs */}
        <div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl animate-pulse"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl"
          aria-hidden
        />

        <div className="relative max-w-3xl mx-auto px-6 pt-6">
          <Logo size="md" light />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 pb-10 md:pb-14 pt-8 animate-fade-in-up">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-100">
            Your submission page
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2">
            Hello, {creator?.name} <span className="inline-block animate-pulse">👋</span>
          </h1>
          <p className="text-sm text-orange-50/90 mt-2 flex items-center gap-2 flex-wrap">
            <span>{creator ? countryFlag(creator.country) : ""}</span>
            <span>{creator?.country}</span>
            <span className="text-orange-200">·</span>
            <span>Log your hours and videos for each day.</span>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
            <HeroStat label="Hours" value={totals.hours.toFixed(1)} />
            <HeroStat label="Videos" value={String(totals.videos)} />
            <HeroStat label="Days" value={String(totals.days)} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Paused banner */}
        {isPaused && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 mb-5 animate-fade-in">
            <p className="text-sm text-amber-900 font-semibold flex items-center gap-2">
              <span className="text-lg">⏸</span> Your account is paused
            </p>
            <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
              You can&apos;t submit new entries right now. Please contact your
              manager to reactivate your account.
            </p>
          </div>
        )}

        {/* Info banner */}
        {!isPaused && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-6 animate-fade-in">
            <p className="text-xs text-orange-900">
              <span className="font-semibold">Heads up:</span> once you confirm
              a day, it becomes <span className="font-semibold">locked</span>.
              Only your manager can change it after that.
            </p>
          </div>
        )}

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {monthLabel(month)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tap any day to log your work
            </p>
          </div>
          <div className="flex gap-2">
            <NavBtn onClick={() => setMonth(shiftMonth(month, -1))}>←</NavBtn>
            <NavBtn onClick={() => setMonth(currentMonth())}>Today</NavBtn>
            <NavBtn onClick={() => setMonth(shiftMonth(month, 1))}>→</NavBtn>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white border border-orange-100 rounded-2xl p-3 md:p-5 shadow-sm animate-fade-in-up">
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 py-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {dayCells.map((c, i) => {
              if (!c) return <div key={`empty-${i}`} className="aspect-square" />;
              const e = entryByDate.get(c.date);
              const isToday = c.date === today;
              const disabled = c.future || isPaused;

              return (
                <button
                  key={c.date}
                  disabled={disabled}
                  onClick={() => setOpenDate(c.date)}
                  className={`aspect-square rounded-xl p-1.5 md:p-2 text-left border transition-all hover:scale-[1.03] active:scale-95 ${
                    disabled
                      ? "border-slate-100 bg-slate-50/40 text-slate-300 cursor-not-allowed hover:scale-100"
                      : e
                      ? "border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 hover:shadow-md hover:shadow-orange-500/20"
                      : "border-slate-200 bg-white hover:border-orange-400 hover:bg-orange-50/40"
                  } ${
                    isToday
                      ? "ring-2 ring-orange-400 ring-offset-1"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        disabled
                          ? "text-slate-300"
                          : e
                          ? "text-orange-800"
                          : "text-slate-700"
                      }`}
                    >
                      {c.day}
                    </span>
                    {!!e && e.locked === 1 && (
                      <span className="hidden md:inline text-[9px] font-bold text-orange-700 bg-white/70 px-1.5 py-0.5 rounded">
                        ✓
                      </span>
                    )}
                  </div>
                  {e ? (
                    <div className="mt-1 text-[10px] md:text-[11px] leading-tight">
                      <div className="font-semibold text-slate-900">
                        {Number(e.hours).toFixed(1)}h
                      </div>
                      <div className="text-slate-600">{e.videos}v</div>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-200 bg-white" />
            Empty
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100" />
            Submitted & locked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-100 bg-slate-50" />
            Future (disabled)
          </span>
        </div>

        <footer className="mt-12 pb-6 text-center text-[11px] text-slate-400">
          Powered by{" "}
          <span className="font-semibold text-orange-600">CreatorHours</span>
        </footer>
      </main>

      {openDate && creator && !isPaused && (
        <SubmitModal
          slug={creator.slug}
          date={openDate}
          existing={entryByDate.get(openDate)}
          onClose={() => setOpenDate(null)}
          onSaved={() => {
            setOpenDate(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function NavBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
    >
      {children}
    </button>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20 hover:bg-white/20 transition-colors">
      <p className="text-[10px] uppercase tracking-wider text-orange-100 font-medium">
        {label}
      </p>
      <p className="text-xl font-semibold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

function SubmitModal({
  slug,
  date,
  existing,
  onClose,
  onSaved,
}: {
  slug: string;
  date: string;
  existing?: Entry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isLocked = !!existing && existing.locked === 1;

  const [hours, setHours] = useState<string>(
    existing ? String(existing.hours) : ""
  );
  const [videos, setVideos] = useState<string>(
    existing ? String(existing.videos) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  async function doSubmit() {
    setSubmitting(true);
    setError(null);
    const h = Number(hours);
    const v = Number(videos);
    if (!Number.isFinite(h) || h < 0 || h > 24) {
      setError("Please enter valid hours (0–24).");
      setSubmitting(false);
      return;
    }
    if (!Number.isInteger(v) || v < 0) {
      setError("Please enter a whole number of videos.");
      setSubmitting(false);
      return;
    }
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, date, hours: h, videos: v }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Failed to submit");
      setSubmitting(false);
      return;
    }
    onSaved();
  }

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end md:place-items-center bg-slate-900/40 backdrop-blur-sm md:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">
            {isLocked ? "Locked entry" : existing ? "Resume entry" : "New entry"}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">
            {dateLabel}
          </h3>

          {isLocked ? (
            <div className="mt-5">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  Submitted & locked
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                      {Number(existing!.hours).toFixed(1)}h
                    </p>
                    <p className="text-[11px] text-slate-600">Hours</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                      {existing!.videos}
                    </p>
                    <p className="text-[11px] text-slate-600">Videos</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                This entry is locked. Contact your manager if a change is needed.
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !confirmStep ? (
            <>
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                      Hours
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="e.g. 2"
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm tabular-nums transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                      Videos
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={videos}
                      onChange={(e) => setVideos(e.target.value)}
                      placeholder="e.g. 3"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm tabular-nums transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    const h = Number(hours);
                    const v = Number(videos);
                    if (!Number.isFinite(h) || h < 0 || h > 24) {
                      setError("Please enter valid hours (0–24).");
                      return;
                    }
                    if (!Number.isInteger(v) || v < 0) {
                      setError("Please enter a whole number of videos.");
                      return;
                    }
                    setConfirmStep(true);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-md hover:shadow-orange-500/30 transition-all"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-5">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">
                    Please confirm
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-3xl font-semibold text-slate-900 tabular-nums">
                        {Number(hours).toFixed(1)}h
                      </p>
                      <p className="text-[11px] text-slate-600">Hours</p>
                    </div>
                    <div>
                      <p className="text-3xl font-semibold text-slate-900 tabular-nums">
                        {Number(videos)}
                      </p>
                      <p className="text-[11px] text-slate-600">Videos</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  Once you confirm, this entry will be{" "}
                  <span className="font-semibold">locked</span> and you
                  won&apos;t be able to change it. Only your manager can edit it
                  afterwards.
                </p>
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">
                    {error}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmStep(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  onClick={doSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-md hover:shadow-orange-500/30 disabled:opacity-60 transition-all"
                >
                  {submitting ? "Confirming…" : "Confirm & lock"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
