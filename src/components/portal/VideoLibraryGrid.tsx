"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Play, Search, Calendar, Loader2, X } from "lucide-react";
import { videoCategories } from "@/lib/content";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type LibraryVideo = {
  id: string;
  sessionId: string;
  title: string;
  date: string;
  duration: string;
  categories: string[];
  thumbnail: string;
  notes?: string;
  status?: string;
  publicUrl?: string | null;
  storagePath?: string | null;
};

interface VideoLibraryGridProps {
  videos: LibraryVideo[];
}

export function VideoLibraryGrid({ videos }: VideoLibraryGridProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [playing, setPlaying] = useState<{
    id: string;
    title: string;
    url: string;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const matchesCategory =
        category === "All" || v.categories.includes(category);
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.categories.some((c) => c.toLowerCase().includes(q)) ||
        (v.notes?.toLowerCase().includes(q) ?? false);
      return matchesCategory && matchesQuery;
    });
  }, [videos, query, category]);

  async function openVideo(video: LibraryVideo) {
    if (video.status === "processing") return;
    setPlayError(null);
    setLoadingId(video.id);
    try {
      const res = await fetch(`/api/videos/${video.id}/url`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPlayError(data.error || "Unable to load private recording.");
        return;
      }
      setPlaying({ id: video.id, title: video.title, url: data.url });
    } catch {
      setPlayError("Failed to fetch signed URL.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search sessions, categories, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            aria-label="Search session library"
          />
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 mb-8"
        role="group"
        aria-label="Filter by category"
      >
        {videoCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs sm:text-sm border transition-colors",
              category === cat
                ? "bg-forest text-cream border-forest"
                : "bg-white border-border text-ink-soft hover:border-teal/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {playError && (
        <p
          className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {playError}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-muted py-16">
          {videos.length === 0
            ? "No recordings yet. After your sessions are processed, they will appear here."
            : "No sessions match your filters. Try another category or search term."}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              loading={loadingId === video.id}
              onPlay={() => openVideo(video)}
            />
          ))}
        </div>
      )}

      {playing && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-forest-deep/90 p-4"
          role="dialog"
          aria-modal
          aria-label={playing.title}
        >
          <div className="w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-elevated">
            <div className="flex items-center justify-between px-4 py-3 bg-forest text-cream">
              <p className="font-serif text-lg truncate pr-4">{playing.title}</p>
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="rounded-full p-2 hover:bg-cream/10"
                aria-label="Close player"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <video
              src={playing.url}
              controls
              autoPlay
              className="w-full aspect-video bg-black"
              controlsList="nodownload"
            >
              Your browser does not support video playback.
            </video>
            <p className="px-4 py-2 text-xs text-cream/50 bg-forest-deep">
              Private signed URL · expires in 1 hour · owner-only access
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  video,
  loading,
  onPlay,
}: {
  video: LibraryVideo;
  loading: boolean;
  onPlay: () => void;
}) {
  const processing = video.status === "processing";
  const failed = video.status === "failed";

  return (
    <article className="group rounded-2xl border border-border bg-white overflow-hidden shadow-soft transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5">
      <div className="relative aspect-video-card overflow-hidden bg-forest/10">
        <Image
          src={video.thumbnail}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-forest-deep/20 group-hover:bg-forest-deep/35 transition-colors" />
        {processing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-cream">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs">Processing</span>
          </div>
        ) : failed ? (
          <div className="absolute inset-0 flex items-center justify-center text-cream text-sm px-4 text-center">
            Recording failed
          </div>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center"
            aria-label={`Play ${video.title}`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream/95 text-forest shadow-elevated transition-transform group-hover:scale-110">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Play
                  className="h-6 w-6 ml-0.5"
                  fill="currentColor"
                  aria-hidden
                />
              )}
            </span>
          </button>
        )}
        <span className="absolute bottom-3 right-3 rounded-md bg-forest-deep/80 px-2 py-0.5 text-xs text-cream">
          {video.duration}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {new Date(video.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <h3 className="font-serif text-lg text-forest leading-snug mb-2">
          {video.title}
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {video.categories.map((c) => (
            <Badge key={c} variant="teal">
              {c}
            </Badge>
          ))}
          {video.status && video.status !== "ready" && (
            <Badge variant="outline">{video.status}</Badge>
          )}
        </div>
        {video.notes && (
          <p className="text-sm text-ink-soft line-clamp-2">{video.notes}</p>
        )}
      </div>
    </article>
  );
}
