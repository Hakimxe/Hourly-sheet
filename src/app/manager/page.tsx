"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  countryFlag,
  currentMonth,
  formatStartedOn,
  monthLabel,
  ymd,
} from "@/lib/utils";

type CreatorWithStats = {
  id: number;
  name: string;
  country: string;
  slug: string;
  status: "active" | "paused";
  created_at: string;
  total_hours: number;
  total_videos: number;
  days: number;
};

type StatusFilter = "all" | "active" | "paused";
type DateRange = "anytime" | "today" | "week" | "month" | "custom";
type Sort = "newest" | "oldest" | "name";

export default function ManagerPage() {
  const [creators, setCreators] = useState<CreatorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCreator, setEditingCreator] =
    useState<CreatorWithStats | null>(null);
  const [deletingCreator, setDeletingCreator] =
    useState<CreatorWithStats | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("anytime");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Compute date range params
  const dateParams = useMemo(() => {
    const today = new Date();
    const t = ymd(today);
    if (dateRange === "today") return { from: t, to: t };
    if (dateRange === "week") {
      const start = new Date(today);
      const dow = start.getDay(); // 0=Sun
      const diff = dow === 0 ? 6 : dow - 1; // make Mon start of week
      start.setDate(start.getDate() - diff);
      return { from: ymd(start), to: t };
    }
    if (dateRange === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: ymd(start), to: t };
    }
    if (dateRange === "custom") {
      return { from: customFrom || undefined, to: customTo || undefined };
    }
    return { from: undefined, to: undefined };
  }, [dateRange, customFrom, customTo]);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter !== "all") qs.set("status", statusFilter);
    if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());
    if (dateParams.from) qs.set("startedFrom", dateParams.from);
    if (dateParams.to) qs.set("startedTo", dateParams.to);
    qs.set("sort", sort);
    const res = await fetch(`/api/creators?${qs.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setCreators(data);
    setLoading(false);
  }, [statusFilter, debouncedSearch, dateParams.from, dateParams.to, sort]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  function copyLink(slug: string, id: number) {
    const url = `${origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function toggleStatus(c: CreatorWithStats) {
    const newStatus = c.status === "active" ? "paused" : "active";
    await fetch(`/api/creators/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCreators();
  }

  const totals = useMemo(() => {
    const activeCount = creators.filter((c) => c.status === "active").length;
    const pausedCount = creators.filter((c) => c.status === "paused").length;
    return creators.reduce(
      (acc, c) => ({
        hours: acc.hours + Number(c.total_hours || 0),
        videos: acc.videos + Number(c.total_videos || 0),
        active: activeCount,
        paused: pausedCount,
      }),
      { hours: 0, videos: 0, active: activeCount, paused: pausedCount }
    );
  }, [creators]);

  const hasFilters =
    statusFilter !== "all" ||
    dateRange !== "anytime" ||
    debouncedSearch.trim().length > 0;

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateRange("anytime");
    setCustomFrom("");
    setCustomTo("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white">
      {/* Top bar */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Logged in as{" "}
              <span className="text-slate-900 font-medium">Manager</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-2">
              Overview · {monthLabel(currentMonth())}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
              Your creators
            </h2>
            <p className="text-slate-500 mt-2 max-w-xl">
              Create a creator, share their personal link, and track everything
              they submit — month by month.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-medium px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md shadow-orange-500/20"
          >
            <span className="text-lg leading-none">+</span> Add creator
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 animate-fade-in-up">
          <StatCard
            label="Total creators"
            value={creators.length.toString()}
            sub="Across all countries"
          />
          <StatCard
            label="Active"
            value={totals.active.toString()}
            sub="Currently working"
            accent="emerald"
          />
          <StatCard
            label="Paused"
            value={totals.paused.toString()}
            sub="On hold"
            accent="amber"
          />
          <StatCard
            label="Total hours"
            value={totals.hours.toFixed(1)}
            sub="All time"
            accent="orange"
          />
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-orange-100 rounded-2xl p-4 md:p-5 mb-6 shadow-sm animate-fade-in-up">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:gap-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators by name…"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition-all"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm bg-white transition-all cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>

          {/* Tabs + date filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Status tabs */}
            <div className="inline-flex bg-orange-50 rounded-xl p-1 border border-orange-100">
              {(["all", "active", "paused"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                    statusFilter === s
                      ? "bg-white text-orange-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <span className="text-slate-200">|</span>

            {/* Date range */}
            <div className="inline-flex bg-orange-50 rounded-xl p-1 border border-orange-100 flex-wrap">
              {(
                [
                  { v: "anytime", l: "Anytime" },
                  { v: "today", l: "Today" },
                  { v: "week", l: "This week" },
                  { v: "month", l: "This month" },
                  { v: "custom", l: "Custom" },
                ] as { v: DateRange; l: string }[]
              ).map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setDateRange(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    dateRange === v
                      ? "bg-white text-orange-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-slate-500 hover:text-orange-600 transition-colors ml-auto"
              >
                Clear filters ×
              </button>
            )}
          </div>

          {/* Custom date range inputs */}
          {dateRange === "custom" && (
            <div className="mt-3 flex flex-wrap gap-2 items-center animate-fade-in">
              <label className="text-xs text-slate-500">Started from</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
              />
              <label className="text-xs text-slate-500">to</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
              />
            </div>
          )}
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
          <span>
            {loading
              ? "Loading…"
              : `Showing ${creators.length} ${
                  creators.length === 1 ? "creator" : "creators"
                }`}
          </span>
        </div>

        {/* Creators grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white border border-orange-100 rounded-2xl p-6 h-56 animate-pulse"
              >
                <div className="h-12 w-12 rounded-full bg-orange-100" />
                <div className="h-4 w-32 bg-slate-100 rounded mt-4" />
                <div className="h-3 w-20 bg-slate-100 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : creators.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onAdd={() => setShowForm(true)}
            onReset={resetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {creators.map((c, i) => (
              <div
                key={c.id}
                className="group bg-white border border-orange-100 rounded-2xl p-6 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-full grid place-items-center text-white text-lg font-semibold transition-all ${
                        c.status === "paused"
                          ? "bg-gradient-to-br from-slate-400 to-slate-500 grayscale"
                          : "bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/30"
                      }`}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{c.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span>{countryFlag(c.country)}</span>
                        <span>{c.country}</span>
                      </p>
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>

                <div className="text-[11px] text-slate-400 mb-4 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-orange-300" />
                  Started {formatStartedOn(c.created_at)}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <Mini
                    label="Hours"
                    value={Number(c.total_hours || 0).toFixed(1)}
                  />
                  <Mini label="Videos" value={String(c.total_videos || 0)} />
                  <Mini label="Days" value={String(c.days || 0)} />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(c.slug, c.id)}
                    className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors border border-orange-100"
                  >
                    {copiedId === c.id ? "Copied ✓" : "Copy link"}
                  </button>
                  <Link
                    href={`/manager/creators/${c.id}`}
                    className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-center transition-all shadow-sm shadow-orange-500/20"
                  >
                    View
                  </Link>
                </div>

                {/* Secondary actions */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-orange-50 text-[11px]">
                  <button
                    onClick={() => toggleStatus(c)}
                    className={`font-medium transition-colors ${
                      c.status === "active"
                        ? "text-amber-600 hover:text-amber-700"
                        : "text-emerald-600 hover:text-emerald-700"
                    }`}
                  >
                    {c.status === "active" ? "⏸ Pause" : "▶ Resume"}
                  </button>
                  <button
                    onClick={() => setEditingCreator(c)}
                    className="font-medium text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingCreator(c)}
                    className="font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New creator modal */}
      {showForm && (
        <NewCreatorModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchCreators();
          }}
        />
      )}

      {/* Edit creator modal */}
      {editingCreator && (
        <EditCreatorModal
          creator={editingCreator}
          onClose={() => setEditingCreator(null)}
          onSaved={() => {
            setEditingCreator(null);
            fetchCreators();
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deletingCreator && (
        <DeleteConfirmModal
          creator={deletingCreator}
          onClose={() => setDeletingCreator(null)}
          onDeleted={() => {
            setDeletingCreator(null);
            fetchCreators();
          }}
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "paused" }) {
  if (status === "paused") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Active
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "orange" | "emerald" | "amber";
}) {
  const accentText = {
    orange: "text-orange-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  }[accent ?? "orange"];
  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-5 hover:border-orange-200 transition-colors">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
        {label}
      </p>
      <p
        className={`text-2xl md:text-3xl font-semibold mt-2 tabular-nums ${
          accent ? accentText : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center bg-orange-50/70 rounded-lg py-2 border border-orange-100">
      <p className="text-base font-semibold text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
        {label}
      </p>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onAdd,
  onReset,
}: {
  hasFilters: boolean;
  onAdd: () => void;
  onReset: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="border-2 border-dashed border-orange-200 rounded-2xl p-12 text-center bg-white animate-fade-in">
        <div className="h-14 w-14 rounded-2xl bg-orange-50 grid place-items-center mx-auto mb-4 text-2xl">
          🔎
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          No creators match your filters
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Try clearing filters or adding a new creator.
        </p>
        <button
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-orange-100 transition-colors border border-orange-100"
        >
          Clear filters
        </button>
      </div>
    );
  }
  return (
    <div className="border-2 border-dashed border-orange-200 rounded-2xl p-12 text-center bg-white animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 grid place-items-center mx-auto mb-4 text-2xl">
        👋
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No creators yet</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
        Add your first creator and we&apos;ll generate a private link you can
        share.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
      >
        + Add your first creator
      </button>
    </div>
  );
}

function NewCreatorModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !country.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country }),
    });
    if (res.ok) onCreated();
    setSubmitting(false);
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleCreate} className="p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">
          New creator
        </p>
        <h3 className="text-lg font-semibold text-slate-900 mt-1">
          Add to your team
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          They&apos;ll get a unique link to submit hours.
        </p>

        <div className="mt-5 space-y-4">
          <Field
            label="Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Fazrina"
            autoFocus
          />
          <Field
            label="Country"
            value={country}
            onChange={setCountry}
            placeholder="e.g. Indonesia"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-md hover:shadow-orange-500/30 disabled:opacity-60 transition-all"
          >
            {submitting ? "Creating…" : "Create creator"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditCreatorModal({
  creator,
  onClose,
  onSaved,
}: {
  creator: CreatorWithStats;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(creator.name);
  const [country, setCountry] = useState(creator.country);
  const [status, setStatus] = useState<"active" | "paused">(creator.status);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!name.trim() || !country.trim()) return;
    setSubmitting(true);
    await fetch(`/api/creators/${creator.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country, status }),
    });
    onSaved();
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600">
          Edit creator
        </p>
        <h3 className="text-lg font-semibold text-slate-900 mt-1">
          {creator.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Update profile, country, or pause their account.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Country" value={country} onChange={setCountry} />

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStatus("active")}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  status === "active"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                ▶ Active
              </button>
              <button
                onClick={() => setStatus("paused")}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  status === "paused"
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                ⏸ Paused
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Paused creators can&apos;t submit new entries via their link, but
              their history is kept.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
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
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteConfirmModal({
  creator,
  onClose,
  onDeleted,
}: {
  creator: CreatorWithStats;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function doDelete() {
    setSubmitting(true);
    await fetch(`/api/creators/${creator.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="h-12 w-12 rounded-xl bg-red-50 grid place-items-center text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mt-4">
          Delete {creator.name}?
        </h3>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          This will permanently delete <b>{creator.name}</b> and{" "}
          <b>all {creator.days} day(s)</b> of submitted entries (
          {Number(creator.total_hours).toFixed(1)} hours,{" "}
          {creator.total_videos} videos). This cannot be undone.
        </p>
        <p className="text-xs text-slate-400 mt-3">
          💡 Tip: if you might work with them again, pause instead of deleting.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={doDelete}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-all"
          >
            {submitting ? "Deleting…" : "Yes, delete forever"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1.5 block">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition-all"
      />
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end md:place-items-center bg-slate-900/40 backdrop-blur-sm md:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
