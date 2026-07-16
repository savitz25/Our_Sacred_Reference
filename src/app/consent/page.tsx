import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalH2,
  LegalList,
  LegalPageShell,
} from "@/components/legal/LegalPageShell";
import {
  INFORMED_CONSENT_VERSION,
  serviceNatureExpanded,
  serviceNatureSummary,
} from "@/lib/legal";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Informed Consent & Service Agreement",
  description:
    "Informed Consent for Sacred Reference alternative health, somatic, and mytho-shamanic coaching sessions.",
};

export default function ConsentPage() {
  return (
    <LegalPageShell
      title="Informed Consent / Service Agreement"
      description="Please read this agreement carefully before booking. You must accept it to schedule a session."
      currentPath="/consent"
    >
      <section>
        <LegalH2>1. Purpose of this agreement</LegalH2>
        <p>
          This Informed Consent and Service Agreement explains the nature of
          Sacred Reference sessions so you can decide, freely and knowingly,
          whether to participate. By checking the consent box at booking (or
          otherwise indicating agreement), you confirm that you have read,
          understood, and accept this document (version{" "}
          <strong className="text-ink">{INFORMED_CONSENT_VERSION}</strong>).
        </p>
      </section>

      <section>
        <LegalH2>2. Nature of the work</LegalH2>
        <p className="font-medium text-ink mb-4">{serviceNatureSummary}</p>
        <div className="rounded-2xl border border-gold/40 bg-cream-dark/60 p-5 sm:p-6 space-y-3">
          {serviceNatureExpanded.map((line) => (
            <p key={line} className="text-ink">
              {line}
            </p>
          ))}
        </div>
        <p className="mt-4">
          Work may include conversation, guided attention to bodily sensation
          (felt sense), somatic practices, inner child integration themes,
          dream/image exploration, myth and symbol, and mytho-shamanic
          perspectives. These are offered as coaching and personal-growth
          frameworks —{" "}
          <strong className="text-ink">
            not as clinical psychotherapy, medical treatment, or licensed
            counseling
          </strong>
          .
        </p>
      </section>

      <section>
        <LegalH2>3. Not a substitute for professional care</LegalH2>
        <LegalList
          items={[
            "You agree to consult licensed medical, psychiatric, or mental health professionals for diagnosis, treatment, medication, or crisis support.",
            "If you have a history of trauma, psychiatric diagnosis, or medical conditions, you are encouraged to discuss participation with a licensed provider.",
            "Sacred Reference does not provide emergency services. In a crisis, call local emergency services or a crisis hotline immediately.",
          ]}
        />
      </section>

      <section>
        <LegalH2>4. Voluntary participation and risks</LegalH2>
        <p>
          Participation is voluntary. You may pause or end a session at any
          time. Embodied and depth-oriented exploration can bring up intense
          emotions, memories, physical sensations, or spiritual experiences.
          You participate{" "}
          <strong className="text-ink">at your own risk</strong> and accept
          responsibility for your choices about self-care and professional
          support outside of sessions.
        </p>
      </section>

      <section>
        <LegalH2>5. Confidentiality (not HIPAA)</LegalH2>
        <p>
          Session content is held in confidence as a matter of professional
          ethics and respect. However,{" "}
          <strong className="text-ink">
            communications and records are not protected under HIPAA
          </strong>
          . Limits to confidentiality may include situations involving imminent
          risk of serious harm, legal requirements, or as described in our{" "}
          <Link href="/privacy-policy" className="text-teal hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <LegalH2>6. Online sessions and technology</LegalH2>
        <LegalList
          items={[
            "Sessions are typically held by secure video in the browser or via related tools.",
            "You are responsible for a private space, stable connection, and appropriate device setup.",
            "Technology can fail; if a session is interrupted, we will make reasonable efforts to reschedule or complete the meeting.",
          ]}
        />
      </section>

      <section>
        <LegalH2>7. Recording and session library</LegalH2>
        <p>
          When recording is enabled and you have agreed (including portal
          preferences and this consent), sessions may be recorded for your
          private library and practice administration. Recordings are intended
          for personal use only and should not be published or shared publicly
          without written permission. Processing may include storage, basic
          editing, and categorization tags aligned with the approach pillars.
        </p>
      </section>

      <section>
        <LegalH2>8. Your responsibilities</LegalH2>
        <LegalList
          items={[
            "Provide accurate contact and intake information.",
            "Arrive free from substances that impair judgment, unless prescribed and managed with a licensed provider.",
            "Respect the relational container: no harassment, threats, or misuse of recordings or the portal.",
            "Seek appropriate professional care for medical or mental health needs.",
          ]}
        />
      </section>

      <section>
        <LegalH2>9. Acknowledgment</LegalH2>
        <p>
          By agreeing at booking, you acknowledge that you have had the
          opportunity to read this Informed Consent, the{" "}
          <Link href="/terms" className="text-teal hover:underline">
            Terms of Service
          </Link>
          , and the{" "}
          <Link href="/privacy-policy" className="text-teal hover:underline">
            Privacy Policy
          </Link>
          ; that you understand Sacred Reference is alternative health and
          embodied coaching for personal growth — not medical or clinical
          therapy; and that you enter the work voluntarily and at your own risk.
        </p>
      </section>

      <div className="rounded-2xl bg-sacred-gradient p-6 sm:p-8 text-center text-cream !mt-12">
        <p className="font-serif text-xl sm:text-2xl mb-3">
          Ready to book with clear understanding?
        </p>
        <p className="text-cream/80 text-sm mb-6 max-w-md mx-auto">
          You will be asked to confirm this consent on the booking form before
          your discovery session is confirmed.
        </p>
        <Button href="/book-session" variant="gold">
          Book free discovery session
        </Button>
      </div>
    </LegalPageShell>
  );
}
