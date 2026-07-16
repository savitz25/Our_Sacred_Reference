import { PortalNav } from "@/components/portal/PortalNav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <PortalNav />
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-10">
        {children}
      </div>
    </div>
  );
}
