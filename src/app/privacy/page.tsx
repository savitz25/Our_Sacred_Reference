import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy practices for Sacred Reference.",
};

export default function PrivacyPage() {
  return (
    <Section className="bg-cream" narrow>
      <h1 className="font-serif text-4xl text-forest mb-6">Privacy</h1>
      <div className="prose prose-forest space-y-4 text-ink-soft leading-relaxed">
        <p>
          Sacred Reference takes the confidentiality of therapeutic
          relationships seriously. Session content, recordings, and personal
          data are intended to be protected with encryption in transit and at
          rest, role-based access, and private storage.
        </p>
        <p>
          This page is a design placeholder. Full privacy policy and HIPAA/BAA
          language will be prepared with legal counsel before production launch
          of video recording and client health data features.
        </p>
        <p>
          Contact:{" "}
          <a
            href="mailto:hello@sacredreference.com"
            className="text-teal hover:underline"
          >
            hello@sacredreference.com
          </a>
        </p>
      </div>
    </Section>
  );
}
