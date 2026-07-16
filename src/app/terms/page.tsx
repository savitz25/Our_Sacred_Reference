import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Sacred Reference.",
};

export default function TermsPage() {
  return (
    <Section className="bg-cream" narrow>
      <h1 className="font-serif text-4xl text-forest mb-6">Terms of use</h1>
      <div className="space-y-4 text-ink-soft leading-relaxed">
        <p>
          Sacred Reference offers online sessions for personal growth and
          healing. Services are not a substitute for emergency or crisis care.
          If you are in immediate danger, contact local emergency services.
        </p>
        <p>
          This page is a design placeholder. Complete terms of service will be
          finalized with legal review prior to production use of scheduling,
          payments, and recorded sessions.
        </p>
      </div>
    </Section>
  );
}
