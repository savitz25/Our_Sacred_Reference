import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalH2,
  LegalList,
  LegalPageShell,
} from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Sacred Reference collects, uses, and protects personal information for coaching and portal services.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="How we collect, use, store, and share information when you use Sacred Reference."
      currentPath="/privacy-policy"
    >
      <section>
        <LegalH2>1. Overview</LegalH2>
        <p>
          Sacred Reference respects your privacy. This Policy explains what
          information we collect, how we use it, and the choices you have. By
          using our website, booking sessions, or using the client portal, you
          acknowledge this Policy and our{" "}
          <Link href="/terms" className="text-teal hover:underline">
            Terms of Service
          </Link>
          .
        </p>
        <p className="mt-3 rounded-2xl border border-gold/30 bg-cream-dark/50 p-5 font-medium text-ink">
          Important: Sacred Reference offers alternative health and embodied
          coaching — not licensed clinical therapy. Session content is treated
          confidentially in practice, but is{" "}
          <strong>not protected under HIPAA</strong>. See our{" "}
          <Link href="/consent" className="text-teal hover:underline">
            Informed Consent
          </Link>{" "}
          for the full service description.
        </p>
      </section>

      <section>
        <LegalH2>2. Information we collect</LegalH2>
        <LegalList
          items={[
            "Identity and contact data: name, email, phone, account credentials.",
            "Booking and session data: scheduled times, session type, notes you provide, attendance status.",
            "Communications: messages you send us and form submissions (including intention fields).",
            "Consent records: timestamps and version of Informed Consent and related agreements.",
            "Technical data: IP address, browser type, device information, cookies, and usage logs needed to secure and improve the site.",
            "Media: session recordings and related metadata when recording is enabled and you have consented.",
            "Payment data (when applicable): processed by third-party payment processors; we do not store full card numbers on our servers.",
          ]}
        />
      </section>

      <section>
        <LegalH2>3. How we use information</LegalH2>
        <LegalList
          items={[
            "Provide, schedule, and deliver coaching sessions and portal access.",
            "Create and maintain your account and private session library.",
            "Process recordings (where consented) and store them for your use.",
            "Send service-related emails (confirmations, reminders, recording-ready notices).",
            "Improve the website, fix errors, and protect against fraud or abuse.",
            "Comply with legal obligations and enforce our Terms.",
            "Document that you agreed to Informed Consent and service disclaimers.",
          ]}
        />
      </section>

      <section>
        <LegalH2>4. Legal bases (where applicable)</LegalH2>
        <p>
          Depending on your location, we may process data based on contract
          (providing the service you requested), consent (e.g., marketing or
          recording where required), legitimate interests (security, service
          improvement), and legal obligations.
        </p>
      </section>

      <section>
        <LegalH2>5. Sharing and processors</LegalH2>
        <p>
          We do not sell your personal information. We may share data with
          trusted service providers who help us operate the platform, such as:
        </p>
        <LegalList
          items={[
            "Hosting and infrastructure (e.g., Vercel)",
            "Authentication and database (e.g., Supabase)",
            "Video conferencing / recording (e.g., LiveKit or similar)",
            "Email delivery providers",
            "Payment processors (when payments are enabled)",
          ]}
        />
        <p className="mt-3">
          These providers process data under agreements and only as needed to
          perform their services. We may also disclose information if required by
          law, legal process, or to protect rights, safety, or property.
        </p>
      </section>

      <section>
        <LegalH2>6. Confidentiality and security</LegalH2>
        <p>
          We use reasonable administrative, technical, and organizational
          measures to protect personal data (encryption in transit, access
          controls, private storage for recordings where configured). No method
          of transmission or storage is 100% secure.{" "}
          <strong className="text-ink">
            Because this is not a HIPAA-covered clinical practice, your
            information is not afforded HIPAA statutory protections.
          </strong>
        </p>
      </section>

      <section>
        <LegalH2>7. Cookies and analytics</LegalH2>
        <p>
          We may use essential cookies for authentication and session security.
          If privacy-focused analytics are enabled, they help us understand
          aggregate site usage. You can control cookies through your browser
          settings; disabling essential cookies may affect login and booking.
        </p>
      </section>

      <section>
        <LegalH2>8. Retention</LegalH2>
        <p>
          We retain account, booking, consent, and session records for as long
          as needed to provide services, resolve disputes, and meet legal or
          legitimate business requirements. You may request deletion of your
          account; some records may be retained where required by law or for
          legitimate documentation of consent and safety.
        </p>
      </section>

      <section>
        <LegalH2>9. Your rights and choices</LegalH2>
        <p>
          Subject to applicable law, you may request access, correction,
          deletion, or export of your personal data, and you may withdraw consent
          where processing is consent-based (withdrawal does not affect prior
          lawful processing). Contact us using the email below. You may also
          opt out of non-essential marketing emails via unsubscribe links.
        </p>
      </section>

      <section>
        <LegalH2>10. Children</LegalH2>
        <p>
          Services are intended for adults. We do not knowingly collect personal
          information from children under 18. If you believe a child has provided
          data, contact us so we can delete it.
        </p>
      </section>

      <section>
        <LegalH2>11. International transfers</LegalH2>
        <p>
          Data may be processed in the United States or other countries where
          our providers operate. Where required, we use appropriate safeguards
          for cross-border transfers.
        </p>
      </section>

      <section>
        <LegalH2>12. Changes to this Policy</LegalH2>
        <p>
          We may update this Privacy Policy periodically. The effective date at
          the top of this page will change when updates are published. Continued
          use of the services after updates constitutes acknowledgment of the
          revised Policy.
        </p>
      </section>

      <section>
        <LegalH2>13. Contact</LegalH2>
        <p>
          Privacy questions or requests:{" "}
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
