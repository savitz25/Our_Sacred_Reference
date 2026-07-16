"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Search, Calendar } from "lucide-react";
import { mockVideos, type MockVideo } from "@/lib/mock-data";
import { videoCategories } from "@/lib/content";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function VideoLibraryGrid() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    return mockVideos.filter((v) => {
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
  }, [query, category]);

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

      {filtered.length === 0 ? (
        <p className="text-center text-muted py-16">
          No sessions match your filters. Try another category or search term.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video }: { video: MockVideo }) {
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
        <Link
          href={`/portal/session/${video.sessionId}`}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={`Play ${video.title}`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream/95 text-forest shadow-elevated transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 ml-0.5" fill="currentColor" aria-hidden />
          </span>
        </Link>
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
        </div>
        {video.notes && (
          <p className="text-sm text-ink-soft line-clamp-2">{video.notes}</p>
        )}
      </div>
    </article>
  );
}
