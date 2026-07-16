import { PortalNav } from "@/components/portal/PortalNav";
import { requirePractitioner } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requirePractitioner();

  return (
    <div className="min-h-screen bg-cream">
      <PortalNav
        userName={profile.full_name ?? profile.email}
        userRole={profile.role}
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-10">
        {children}
      </div>
    </div>
  );
}
