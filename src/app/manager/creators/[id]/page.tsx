"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  countryFlag,
  currentMonth,
  daysInMonth,
  firstWeekdayOfMonth,
  formatStartedOn,
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
  created_at: string;
};

type Entry = {
  id: number;
  creator_id: number;
  date: string;
  hours: number;
  videos: number;
  locked: number;
};

export default function CreatorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState<string>(currentMonth());
  const [loading, setLoading] = useState(true);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/creators/${id}?month=${month}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setCreator(data.creator);
      setEntries(data.entries);
    }
    setLoading(false);
  }, [id, month]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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

  function copyLink() {
    if (!creator) return;
    navigator.clipboard.writeText(`${origin}/c/${creator.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function toggleStatus() {
    if (!creator) return;
    const newStatus = creator.status === "active" ? "paused" : "active";
    await fetch(`/api/creators/${creator.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function doDelete() {
    if (!creator) return;
    await fetch(`/api/creators/${creator.id}`, { method: "DELETE" });
    router.push("/manager");
  }

  const totalDays = daysInMonth(month);
  const firstDow = firstWeekdayOfMonth(month);
  const today = ymd(new Date());

  const dayCells: ({ day: number; date: string } | null)[] = [];
  for (let i = 0; i < firstDow; i++) dayCells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const [y, m] = month.split("-").map(Number);
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayCells.push({ day: d, date });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white">
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <Link href="/manager" className="flex items-center gap-3">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            {creator && (
              <button
                onClick={copyLink}
                className="text-xs font-medium px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-100 transition-colors"
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            )}
            <Link
              href="/manager"
              className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading && !creator ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Loading…
          </div>
        ) : !creator ? (
          <div className="text-center py-20 text-slate-500">
            Creator not found
          </div>
        ) : (
          <>
            {/* Creator header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in-up">
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-2xl grid place-items-center text-white text-2xl font-semibold ${
                    creator.status === "paused"
                      ? "bg-gradient-to-br from-slate-400 to-slate-500 grayscale"
                      : "bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30"
                  }`}
                >
                  {creator.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                      {creator.name}
                    </h1>
                    <StatusBadge status={creator.status} />
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                    <span>{countryFlag(creator.country)}</span>
                    <span>{creator.country}</span>
                    <span className="text-slate-300">·</span>
                    <span>Started {formatStartedOn(creator.created_at)}</span>
                  </p>
                  <code className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded mt-1.5 inline-block border border-orange-100">
                    /c/{creator.slug}
                  </code>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={toggleStatus}
                  className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    creator.status === "active"
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {creator.status === "active" ? "⏸ Pause" : "▶ Resume"}
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="text-xs font-medium px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Paused banner */}
            {creator.status === "paused" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 animate-fade-in">
                <span className="text-lg">⏸</span>
                <p className="text-xs text-amber-900">
                  <span className="font-semibold">This creator is paused.</span>{" "}
                  Their submission link is disabled — they can&apos;t add new
                  entries until you resume them.
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8 animate-fade-in-up">
              <Stat label="Hours this month" value={totals.hours.toFixed(1)} />
              <Stat label="Videos this month" value={String(totals.videos)} />
              <Stat label="Days worked" value={String(totals.days)} />
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {monthLabel(month)}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any day to add or edit an entry. You can edit even
                  locked ones.
                </p>
              </div>
              <div className="flex gap-2">
                <NavBtn onClick={() => setMonth(shiftMonth(month, -1))}>
                  ←
                </NavBtn>
                <NavBtn onClick={() => setMonth(currentMonth())}>Today</NavBtn>
                <NavBtn onClick={() => setMonth(shiftMonth(month, 1))}>
                  →
                </NavBtn>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-orange-100 rounded-2xl p-4 md:p-6 shadow-sm animate-fade-in-up">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {dayCells.map((c, i) => {
                  if (!c)
                    return (
                      <div key={`empty-${i}`} className="aspect-square" />
                    );
                  const e = entryByDate.get(c.date);
                  const isToday = c.date === today;
                  return (
                    <button
                      key={c.date}
                      onClick={() => setEditDate(c.date)}
                      className={`aspect-square rounded-xl p-2 text-left border transition-all hover:scale-[1.02] ${
                        e
                          ? "border-orange-200 bg-orange-50/70 hover:bg-orange-50 hover:shadow-md hover:shadow-orange-500/10"
                          : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                      } ${
                        isToday
                          ? "ring-2 ring-orange-400 ring-offset-1"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${
                            e ? "text-orange-700" : "text-slate-700"
                          }`}
                        >
                          {c.day}
                        </span>
                        {!!e && e.locked === 1 && (
                          <span className="text-[9px] font-medium text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                            Locked
                          </span>
                        )}
                      </div>
                      {e ? (
                        <div className="mt-1.5 text-[11px] leading-tight">
                          <div className="font-semibold text-slate-900">
                            {Number(e.hours).toFixed(1)}h
                          </div>
                          <div className="text-slate-500">{e.videos} videos</div>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {editDate && creator && (
        <EditModal
          date={editDate}
          existing={entryByDate.get(editDate)}
          creatorId={creator.id}
          onClose={() => setEditDate(null)}
          onSaved={() => {
            setEditDate(null);
            load();
          }}
        />
      )}

      {showDelete && creator && (
        <DeleteCreatorModal
          name={creator.name}
          days={totals.days}
          hours={totals.hours}
          videos={totals.videos}
          onClose={() => setShowDelete(false)}
          onConfirm={doDelete}
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
      className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: "active" | "paused" }) {
  if (status === "paused") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Active
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-5 hover:border-orange-200 transition-colors">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900 mt-2 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function EditModal({
  date,
  existing,
  creatorId: _creatorId,
  onClose,
  onSaved,
}: {
  date: string;
  existing?: Entry;
  creatorId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [hours, setHours] = useState<string>(
    existing ? String(existing.hours) : ""
  );
  const [videos, setVideos] = useState<string>(
    existing ? String(existing.videos) : ""
  );
  const [locked, setLocked] = useState<boolean>(
    existing ? existing.locked === 1 : true
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSubmitting(true);
    setError(null);
    const h = Number(hours);
    const v = Number(videos);
    if (!Number.isFinite(h) || h < 0) {
      setError("Hours must be ≥ 0");
      setSubmitting(false);
      return;
    }
    if (!Number.isInteger(v) || v < 0) {
      setError("Videos must be a whole number ≥ 0");
      setSubmitting(false);
      return;
    }

    let res: Response;
    if (existing) {
      res = await fetch(`/api/entries/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: h, videos: v, locked: locked ? 1 : 0 }),
      });
    } else {
      res = await fetch(`/api/manager/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: _creatorId,
          date,
          hours: h,
          videos: v,
          locked: locked ? 1 : 0,
        }),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Failed to save");
      setSubmitting(false);
      return;
    }
    onSaved();
  }

  async function remove() {
    if (!existing) return;
    if (!confirm("Delete this entry?")) return;
    setDeleting(true);
    const res = await fetch(`/api/entries/${existing.id}`, {
      method: "DELETE",
    });
    if (res.ok) onSaved();
    setDeleting(false);
  }

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
            {existing ? "Edit entry" : "Add entry"}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">
            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>

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

            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setLocked(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600"
              />
              <span>Locked (creator can&apos;t edit)</span>
            </label>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            {existing ? (
              <button
                onClick={remove}
                disabled={deleting}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-md hover:shadow-orange-500/30 disabled:opacity-60 transition-all"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteCreatorModal({
  name,
  days,
  hours,
  videos,
  onClose,
  onConfirm,
}: {
  name: string;
  days: number;
  hours: number;
  videos: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
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
          <div className="h-12 w-12 rounded-xl bg-red-50 grid place-items-center text-2xl">
            ⚠️
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mt-4">
            Delete {name}?
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            This will permanently delete <b>{name}</b> and{" "}
            <b>all {days} day(s)</b> of submitted entries (
            {Number(hours).toFixed(1)} hours, {videos} videos). This cannot be
            undone.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            💡 Tip: if you might work with them again, pause instead.
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setSubmitting(true);
                await onConfirm();
              }}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all"
            >
              {submitting ? "Deleting…" : "Yes, delete forever"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
