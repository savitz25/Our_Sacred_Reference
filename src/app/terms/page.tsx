import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalH2,
  LegalH3,
  LegalList,
  LegalPageShell,
} from "@/components/legal/LegalPageShell";
import { serviceNatureExpanded } from "@/lib/legal";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: "Terms of Service",
  description:
    "Terms of Service for Sacred Reference alternative health and embodied coaching sessions.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description="Please read these terms carefully before booking or attending sessions with Sacred Reference."
      currentPath="/terms"
    >
      <section>
        <LegalH2>1. Acceptance of terms</LegalH2>
        <p>
          By accessing this website, creating an account, booking a session, or
          participating in any Sacred Reference offering, you agree to these
          Terms of Service and our{" "}
          <Link href="/privacy-policy" className="text-teal hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/consent" className="text-teal hover:underline">
            Informed Consent / Service Agreement
          </Link>
          . If you do not agree, do not use these services.
        </p>
      </section>

      <section>
        <LegalH2>2. Nature of services — important disclaimer</LegalH2>
        <p className="font-medium text-ink">
          Sacred Reference offers alternative health, somatic, and
          mytho-shamanic coaching for personal growth and embodied
          self-exploration — not licensed medical, psychological, or clinical
          therapy. Sessions are not a substitute for professional medical or
          mental health care.
        </p>
        <div className="mt-4 rounded-2xl border border-gold/30 bg-cream-dark/50 p-5 space-y-3">
          {serviceNatureExpanded.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <LegalH3>What this means in practice</LegalH3>
        <LegalList
          items={[
            "Sessions may include somatic practice, felt sense, attachment-informed coaching, Jungian depth psychology themes, mythology, and mytho-shamanic wisdom as educational and exploratory frameworks.",
            "Michele and Sacred Reference do not diagnose, treat, or cure medical or psychiatric conditions, and do not prescribe medication.",
            "You are solely responsible for seeking licensed medical, psychiatric, or psychological care when needed.",
            "If you are in crisis or may harm yourself or others, contact emergency services or a crisis hotline immediately — do not rely on Sacred Reference sessions for crisis care.",
          ]}
        />
      </section>

      <section>
        <LegalH2>3. Eligibility</LegalH2>
        <p>
          You must be at least 18 years of age (or the age of majority in your
          jurisdiction) to book or participate in sessions. By using this site,
          you represent that you meet this requirement and that the information
          you provide is accurate.
        </p>
      </section>

      <section>
        <LegalH2>4. Accounts and portal access</LegalH2>
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for activity under your account. Notify us promptly if
          you suspect unauthorized access. We may suspend or terminate accounts
          that violate these terms or that we reasonably believe pose a safety
          or legal risk.
        </p>
      </section>

      <section>
        <LegalH2>5. Booking, cancellation, and sessions</LegalH2>
        <LegalList
          items={[
            "Discovery and paid sessions are scheduled through the site or related tools. Availability is not guaranteed until confirmed.",
            "You agree to attend on time and in a reasonably private, stable environment suitable for online video.",
            "Cancellation and rescheduling policies may be communicated at booking or by email; late cancellations may forfeit fees where applicable.",
            "Sessions may be recorded when you have consented, for your private portal library and practice administration — see Informed Consent and Privacy Policy.",
          ]}
        />
      </section>

      <section>
        <LegalH2>6. Confidentiality (not HIPAA)</LegalH2>
        <p>
          We treat session content and personal information as confidential and
          use reasonable safeguards. However,{" "}
          <strong className="text-ink">
            sessions and records are not protected under HIPAA
          </strong>
          . Confidentiality may be limited where disclosure is required by law,
          where there is a risk of serious harm, or as otherwise described in
          our Privacy Policy.
        </p>
      </section>

      <section>
        <LegalH2>7. Intellectual property</LegalH2>
        <p>
          Site content, branding, written materials, and session frameworks are
          owned by Sacred Reference or its licensors. You may not copy,
          redistribute, or commercially exploit materials without prior written
          permission, except for personal use of your own session recordings in
          the portal.
        </p>
      </section>

      <section>
        <LegalH2>8. Assumption of risk and limitation of liability</LegalH2>
        <p>
          You acknowledge that embodied and exploratory work can surface strong
          emotions, memories, or physical sensations. You participate{" "}
          <strong className="text-ink">at your own risk</strong>. To the fullest
          extent permitted by law, Sacred Reference and its practitioners are
          not liable for indirect, incidental, consequential, or special
          damages, or for outcomes related to your independent health decisions.
          Our total liability for any claim arising from the services shall not
          exceed the amounts you paid for sessions in the three months preceding
          the claim (or one hundred U.S. dollars if no fees were paid).
        </p>
      </section>

      <section>
        <LegalH2>9. Indemnification</LegalH2>
        <p>
          You agree to indemnify and hold harmless Sacred Reference and its
          practitioners from claims arising out of your misuse of the services,
          violation of these terms, or failure to seek appropriate professional
          care.
        </p>
      </section>

      <section>
        <LegalH2>10. Third-party services</LegalH2>
        <p>
          The site may use third-party providers (hosting, authentication,
          video, email, storage). Their terms and privacy practices also apply
          where relevant. We are not responsible for third-party outages or
          policies beyond our reasonable control.
        </p>
      </section>

      <section>
        <LegalH2>11. Changes</LegalH2>
        <p>
          We may update these Terms from time to time. Continued use after
          changes constitutes acceptance of the revised Terms. Material changes
          may be highlighted on the site or by email when practical.
        </p>
      </section>

      <section>
        <LegalH2>12. Governing law</LegalH2>
        <p>
          These Terms are governed by the laws of the applicable jurisdiction in
          which Sacred Reference primarily operates, without regard to conflict
          of law principles. Venue for disputes shall lie in the competent
          courts of that jurisdiction, unless applicable consumer law requires
          otherwise.
        </p>
      </section>

      <section>
        <LegalH2>13. Contact</LegalH2>
        <p>
          Questions about these Terms:{" "}
          <a
            href="mailto:michele@oursacredreference.com"
            className="text-teal hover:underline"
          >
            michele@oursacredreference.com
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
