import type { Metadata } from "next";
import { requirePractitioner } from "@/lib/auth";
import {
  fetchAdminSessions,
  fetchAdminVideos,
} from "@/lib/admin/queries";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin — Appointments & Recordings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Layout already gates; re-check for defense in depth
  const { profile } = await requirePractitioner("/admin");

  let sessions: Awaited<ReturnType<typeof fetchAdminSessions>> = [];
  let videos: Awaited<ReturnType<typeof fetchAdminVideos>> = [];
  let loadError: string | null = null;

  try {
    const results = await Promise.allSettled([
      fetchAdminSessions(),
      fetchAdminVideos(),
    ]);

    if (results[0].status === "fulfilled") {
      sessions = results[0].value;
    } else {
      console.error("[admin/page] sessions:", results[0].reason);
      loadError = "Could not load appointments.";
    }

    if (results[1].status === "fulfilled") {
      videos = results[1].value;
    } else {
      console.error("[admin/page] videos:", results[1].reason);
      loadError = loadError
        ? `${loadError} Could not load recordings.`
        : "Could not load recordings.";
    }
  } catch (e) {
    console.error("[admin/page] unexpected:", e);
    loadError =
      e instanceof Error
        ? e.message
        : "Unexpected error loading admin data.";
  }

  return (
    <>
      {loadError && (
        <div
          className="mb-6 rounded-xl border border-gold/40 bg-cream-dark/60 px-4 py-3 text-sm text-ink-soft"
          role="alert"
        >
          <p className="font-medium text-forest mb-1">Partial load</p>
          <p>{loadError}</p>
          <p className="mt-2 text-xs text-muted">
            Confirm Supabase env vars on Vercel and that your profile role is{" "}
            <code className="text-forest">practitioner</code>. Check Vercel
            function logs for details.
          </p>
        </div>
      )}
      <AdminDashboard
        sessions={sessions}
        videos={videos}
        practitionerName={
          profile.full_name || profile.email || "Practitioner"
        }
      />
    </>
  );
}
