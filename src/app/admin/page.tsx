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

export default async function AdminPage() {
  const { profile } = await requirePractitioner();
  const [sessions, videos] = await Promise.all([
    fetchAdminSessions(),
    fetchAdminVideos(),
  ]);

  return (
    <AdminDashboard
      sessions={sessions}
      videos={videos}
      practitionerName={profile.full_name || profile.email}
    />
  );
}
