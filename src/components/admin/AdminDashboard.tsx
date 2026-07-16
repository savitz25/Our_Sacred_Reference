"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Film,
  Download,
  Search,
  ExternalLink,
  Video,
  Play,
  Loader2,
} from "lucide-react";
import type { AdminSessionRow, AdminVideoRow } from "@/lib/admin/queries";
import { downloadCsv, rowsToCsv } from "@/lib/admin/csv";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Tab = "appointments" | "recordings";

const SESSION_TYPES = [
  "all",
  "discovery",
  "individual",
  "ongoing",
  "other",
] as const;

const SESSION_STATUSES = [
  "all",
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

interface AdminDashboardProps {
  sessions: AdminSessionRow[];
  videos: AdminVideoRow[];
  practitionerName: string;
}

export function AdminDashboard({
  sessions,
  videos,
  practitionerName,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("appointments");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sessionType, setSessionType] =
    useState<(typeof SESSION_TYPES)[number]>("all");
  const [status, setStatus] =
    useState<(typeof SESSION_STATUSES)[number]>("all");
  const [category, setCategory] = useState("all");
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) =>
      (v.category_tags ?? []).forEach((t) => set.add(t))
    );
    sessions.forEach((s) => {
      if (s.session_type) set.add(s.session_type);
    });
    return ["all", ...Array.from(set).sort()];
  }, [videos, sessions]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (sessionType !== "all" && s.session_type !== sessionType) return false;
      if (status !== "all" && s.status !== status) return false;
      if (category !== "all" && s.session_type !== category && !s.title.toLowerCase().includes(category.toLowerCase())) {
        // category filter on appointments uses session_type primarily
        if (s.session_type !== category) return false;
      }
      if (dateFrom) {
        if (new Date(s.scheduled_at) < startOfDay(dateFrom)) return false;
      }
      if (dateTo) {
        if (new Date(s.scheduled_at) > endOfDay(dateTo)) return false;
      }
      if (q) {
        const hay = [
          s.client_name,
          s.client_email,
          s.title,
          s.session_type,
          s.status,
          s.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, query, dateFrom, dateTo, sessionType, status, category]);

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter((v) => {
      if (category !== "all" && !v.category_tags.includes(category)) {
        return false;
      }
      if (dateFrom) {
        if (new Date(v.created_at) < startOfDay(dateFrom)) return false;
      }
      if (dateTo) {
        if (new Date(v.created_at) > endOfDay(dateTo)) return false;
      }
      if (q) {
        const hay = [
          v.client_name,
          v.client_email,
          v.title,
          v.status,
          ...(v.category_tags ?? []),
          v.transcript_summary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [videos, query, dateFrom, dateTo, category]);

  const upcomingCount = sessions.filter(
    (s) =>
      new Date(s.scheduled_at) >= new Date() &&
      s.status !== "cancelled" &&
      s.status !== "completed"
  ).length;

  function exportAppointments() {
    const csv = rowsToCsv(
      [
        "Client Name",
        "Client Email",
        "Title",
        "Session Type",
        "Scheduled At",
        "Duration (min)",
        "Status",
        "Session ID",
      ],
      filteredSessions.map((s) => [
        s.client_name,
        s.client_email,
        s.title,
        s.session_type,
        s.scheduled_at,
        s.duration_minutes,
        s.status,
        s.id,
      ])
    );
    downloadCsv(
      `sacred-reference-appointments-${dateStamp()}.csv`,
      csv
    );
  }

  function exportRecordings() {
    const csv = rowsToCsv(
      [
        "Client Name",
        "Client Email",
        "Title",
        "Categories",
        "Status",
        "Created At",
        "Duration (sec)",
        "Video ID",
        "Session ID",
      ],
      filteredVideos.map((v) => [
        v.client_name,
        v.client_email,
        v.title,
        v.category_tags.join("; "),
        v.status,
        v.created_at,
        v.duration_seconds,
        v.id,
        v.session_id,
      ])
    );
    downloadCsv(`sacred-reference-recordings-${dateStamp()}.csv`, csv);
  }

  async function playRecording(videoId: string) {
    setPlayError(null);
    setLoadingVideoId(videoId);
    try {
      const res = await fetch(`/api/videos/${videoId}/url`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPlayError(data.error || "Could not open recording");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setPlayError("Failed to fetch signed URL");
    } finally {
      setLoadingVideoId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-teal font-medium tracking-wide uppercase mb-1">
          Practitioner admin
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-forest">
          Hello, {practitionerName.split(" ")[0] || "Michele"}
        </h1>
        <p className="mt-2 text-ink-soft max-w-2xl">
          View and manage all appointments and video consults. Filter by client,
          date, or type. Export filtered results to CSV.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard
          label="Total appointments"
          value={sessions.length}
          icon={Calendar}
        />
        <StatCard label="Upcoming" value={upcomingCount} icon={Video} />
        <StatCard label="Recordings" value={videos.length} icon={Film} />
      </div>

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-2 mb-6"
        role="tablist"
        aria-label="Admin sections"
      >
        <TabButton
          active={tab === "appointments"}
          onClick={() => setTab("appointments")}
        >
          <Calendar className="h-4 w-4" aria-hidden />
          All appointments
          <span className="text-xs opacity-70">({filteredSessions.length})</span>
        </TabButton>
        <TabButton
          active={tab === "recordings"}
          onClick={() => setTab("recordings")}
        >
          <Film className="h-4 w-4" aria-hidden />
          Video consults
          <span className="text-xs opacity-70">({filteredVideos.length})</span>
        </TabButton>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-soft mb-6 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client name, email, title…"
            className="w-full rounded-full border border-border bg-cream/40 pl-10 pr-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            aria-label="Search clients"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From date">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-admin"
            />
          </Field>
          <Field label="To date">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-admin"
            />
          </Field>
          {tab === "appointments" ? (
            <>
              <Field label="Session type">
                <select
                  value={sessionType}
                  onChange={(e) =>
                    setSessionType(
                      e.target.value as (typeof SESSION_TYPES)[number]
                    )
                  }
                  className="input-admin"
                >
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All types" : labelType(t)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as (typeof SESSION_STATUSES)[number]
                    )
                  }
                  className="input-admin"
                >
                  {SESSION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <Field label="Category / topic">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-admin"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-between items-center pt-1">
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDateFrom("");
              setDateTo("");
              setSessionType("all");
              setStatus("all");
              setCategory("all");
            }}
            className="text-sm text-teal hover:underline"
          >
            Clear filters
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              tab === "appointments" ? exportAppointments : exportRecordings
            }
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>

      {playError && (
        <p
          className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {playError}
        </p>
      )}

      {tab === "appointments" ? (
        <AppointmentsTable sessions={filteredSessions} />
      ) : (
        <RecordingsTable
          videos={filteredVideos}
          loadingVideoId={loadingVideoId}
          onPlay={playRecording}
        />
      )}
    </div>
  );
}

function AppointmentsTable({ sessions }: { sessions: AdminSessionRow[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState message="No appointments match your filters." />
    );
  }

  const now = Date.now();

  return (
    <div className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[720px]">
          <thead className="bg-cream-dark/50 text-ink-soft text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Date / time</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.map((s) => {
              const upcoming =
                new Date(s.scheduled_at).getTime() >= now - 60 * 60 * 1000 &&
                s.status !== "cancelled" &&
                s.status !== "completed";
              return (
                <tr key={s.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-forest">
                      {s.client_name || "—"}
                    </p>
                    <p className="text-xs text-muted">{s.client_email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                    {formatDateTime(s.scheduled_at)}
                    <p className="text-xs text-muted">
                      {s.duration_minutes} min
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.session_type === "discovery" ? "gold" : "teal"}>
                      {labelType(s.session_type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{s.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {upcoming ? (
                      <Link
                        href={`/portal/session/${s.id}`}
                        className="inline-flex items-center gap-1 text-teal font-medium hover:underline"
                      >
                        Join
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordingsTable({
  videos,
  loadingVideoId,
  onPlay,
}: {
  videos: AdminVideoRow[];
  loadingVideoId: string | null;
  onPlay: (id: string) => void;
}) {
  if (videos.length === 0) {
    return <EmptyState message="No recordings match your filters." />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[720px]">
          <thead className="bg-cream-dark/50 text-ink-soft text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Categories</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {videos.map((v) => (
              <tr key={v.id} className="hover:bg-cream/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-forest">
                    {v.client_name || "—"}
                  </p>
                  <p className="text-xs text-muted">{v.client_email}</p>
                </td>
                <td className="px-4 py-3 text-ink max-w-[200px]">
                  <p className="truncate" title={v.title}>
                    {v.title}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(v.category_tags.length ? v.category_tags : ["—"]).map(
                      (t) => (
                        <Badge key={t} variant="teal">
                          {t}
                        </Badge>
                      )
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                  {formatDateTime(v.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      v.status === "ready"
                        ? "default"
                        : v.status === "failed"
                          ? "outline"
                          : "gold"
                    }
                  >
                    {v.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {v.status === "ready" ? (
                    <button
                      type="button"
                      onClick={() => onPlay(v.id)}
                      disabled={loadingVideoId === v.id}
                      className="inline-flex items-center gap-1 text-teal font-medium hover:underline disabled:opacity-50"
                    >
                      {loadingVideoId === v.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" aria-hidden />
                      )}
                      View
                    </button>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted">{label}</p>
        <Icon className="h-4 w-4 text-teal" aria-hidden />
      </div>
      <p className="font-serif text-3xl text-forest">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors border",
        active
          ? "bg-forest text-cream border-forest"
          : "bg-white text-ink-soft border-border hover:border-teal/40"
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-ink-soft space-y-1">
      <span>{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center text-muted text-sm">
      {message}
    </div>
  );
}

function labelType(t: string) {
  switch (t) {
    case "discovery":
      return "Free discovery";
    case "individual":
      return "Individual";
    case "ongoing":
      return "Ongoing";
    default:
      return t;
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfDay(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function endOfDay(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}
