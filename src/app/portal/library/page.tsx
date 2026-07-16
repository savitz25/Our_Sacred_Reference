import { VideoLibraryGrid } from "@/components/portal/VideoLibraryGrid";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLibraryPage() {
  const { user, profile } = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (profile.role !== "practitioner" && profile.role !== "admin") {
    query = query.eq("user_id", user.id);
  }

  const { data: videos } = await query;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-forest">
          Session library
        </h1>
        <p className="mt-2 text-ink-soft max-w-2xl">
          Your private embodied archive — filter by category, search by title
          or notes, and revisit past sessions with presence.
        </p>
      </div>
      <VideoLibraryGrid
        videos={(videos ?? []).map((v) => ({
          id: v.id,
          sessionId: v.session_id ?? v.id,
          title: v.title,
          date: v.created_at,
          duration: v.duration_seconds
            ? `${Math.round(v.duration_seconds / 60)} min`
            : v.status === "processing"
              ? "Processing…"
              : "—",
          categories: v.category_tags ?? [],
          thumbnail:
            v.thumbnail_path ||
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
          notes: v.transcript_summary ?? undefined,
          status: v.status,
          publicUrl: v.public_url,
        }))}
      />
    </div>
  );
}
