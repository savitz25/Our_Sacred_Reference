import type { Metadata } from "next";
import { PortalNav } from "@/components/portal/PortalNav";
import { requirePractitioner } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Practitioner admin — private, noindex */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth + role: unauthenticated → /login?next=/admin; non-practitioner → /portal
  const { profile } = await requirePractitioner("/admin");

  return (
    <div className="min-h-screen bg-cream">
      <PortalNav
        userName={profile.full_name ?? profile.email ?? "Practitioner"}
        userRole={profile.role}
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-10">
        {children}
      </div>
    </div>
  );
}
