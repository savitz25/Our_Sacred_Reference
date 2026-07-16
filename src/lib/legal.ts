/** Canonical legal copy for Phase 3 — disclaimers, consent versioning */

export const LEGAL_EFFECTIVE_DATE = "July 16, 2026";
export const INFORMED_CONSENT_VERSION = "2026-07-16";

export const serviceNatureSummary =
  "Sacred Reference offers alternative health, somatic, and mytho-shamanic coaching for personal growth and embodied self-exploration — not licensed medical, psychological, or clinical therapy. Sessions are not a substitute for professional medical or mental health care.";

export const serviceNatureExpanded = [
  "This is alternative health and embodied coaching work focused on somatic practices, felt sense, inner child integration, mytho-shamanic wisdom, and spiritual transformation.",
  "It is not clinical psychotherapy, medical treatment, or licensed counseling.",
  "Participants engage at their own risk and are encouraged to consult licensed professionals for medical or mental health concerns.",
  "All sessions are confidential, but not protected under HIPAA.",
] as const;

export const informedConsentCheckboxLabel =
  "I have read and agree to the Informed Consent and understand that these sessions are for personal growth and alternative healing, not medical or clinical therapy.";

export const legalNav = [
  { name: "Terms of Service", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Informed Consent", href: "/consent" },
] as const;
