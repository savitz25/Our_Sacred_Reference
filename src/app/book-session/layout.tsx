import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { professionalServiceJsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Free Discovery Session — Mytho-Shamanic Somatic Healing",
  description:
    "Schedule your free online discovery session with Michele Castro. Begin a Path of Remembering through mytho-shamanic somatic healing, felt sense, and secure video on Sacred Reference.",
  path: "/book-session",
  keywords: [
    "book somatic healing session online",
    "free discovery session mytho-shamanic",
    "Michele Castro booking",
    "online felt sense session",
    "Path of Remembering session",
    "Divine Feminine coaching session",
  ],
});

export default function BookSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={professionalServiceJsonLd()} />
      <div className="bg-cream border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-3">
          <Breadcrumbs
            items={[{ name: "Book Free Session", path: "/book-session" }]}
          />
        </div>
      </div>
      {children}
    </>
  );
}
