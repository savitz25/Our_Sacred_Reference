/**
 * Stripe key sanitization + shape validation (safe for client + server).
 * Never logs full keys — only prefix, length, and mode.
 */

export type StripeKeyMode = "test" | "live" | "unknown";

export type StripeKeyInspection = {
  present: boolean;
  /** First 8 chars only, e.g. pk_live_ — never the full key */
  prefix: string | null;
  length: number;
  mode: StripeKeyMode;
  looksValid: boolean;
  issues: string[];
};

const MIN_PUBLISHABLE_LENGTH = 32;
const MIN_SECRET_LENGTH = 32;
/** Typical Stripe pk_/sk_ keys are ~100+; shorter often means truncation */
const SUSPICIOUSLY_SHORT = 80;

/**
 * Strip common copy/paste and Vercel env mistakes without altering valid key chars.
 */
export function sanitizeStripeKey(raw: string | undefined | null): string {
  if (raw == null) return "";
  let v = String(raw);

  // BOM + normalize newlines / zero-width spaces
  v = v.replace(/^\uFEFF/, "");
  v = v.replace(/[\u200B-\u200D\uFEFF]/g, "");
  v = v.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  v = v.trim();

  // Strip wrapping quotes (single or double) — common when pasting into Vercel
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }

  // Accidental "Bearer " or "pk_live_ = " style
  v = v.replace(/^Bearer\s+/i, "").trim();
  // Key on its own line after label
  const lineMatch = v.match(
    /(pk_(?:live|test)_[A-Za-z0-9]+|sk_(?:live|test)_[A-Za-z0-9]+)/
  );
  if (lineMatch && lineMatch[1]) {
    v = lineMatch[1];
  }

  // Internal whitespace is never valid in a Stripe key
  v = v.replace(/\s+/g, "");

  return v;
}

export function stripeKeyMode(key: string): StripeKeyMode {
  if (key.includes("_test_")) return "test";
  if (key.includes("_live_")) return "live";
  return "unknown";
}

function keyPrefix(key: string): string | null {
  if (!key) return null;
  // e.g. pk_live_ or sk_test_
  const m = key.match(/^(pk|sk)_(live|test)_/);
  if (m) return `${m[1]}_${m[2]}_`;
  return key.slice(0, Math.min(8, key.length)) || null;
}

export function inspectPublishableKey(
  raw: string | undefined | null
): StripeKeyInspection {
  const key = sanitizeStripeKey(raw);
  const issues: string[] = [];

  if (!key) {
    return {
      present: false,
      prefix: null,
      length: 0,
      mode: "unknown",
      looksValid: false,
      issues: ["missing"],
    };
  }

  const mode = stripeKeyMode(key);
  const prefix = keyPrefix(key);

  if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) {
    issues.push("expected_pk_prefix");
  }
  if (key.length < MIN_PUBLISHABLE_LENGTH) {
    issues.push("too_short");
  } else if (key.length < SUSPICIOUSLY_SHORT) {
    issues.push("possibly_truncated");
  }
  if (/[^A-Za-z0-9_]/.test(key)) {
    issues.push("invalid_characters");
  }
  if (mode === "unknown") {
    issues.push("unknown_mode");
  }

  return {
    present: true,
    prefix,
    length: key.length,
    mode,
    looksValid: issues.length === 0,
    issues,
  };
}

export function inspectSecretKey(
  raw: string | undefined | null
): StripeKeyInspection {
  const key = sanitizeStripeKey(raw);
  const issues: string[] = [];

  if (!key) {
    return {
      present: false,
      prefix: null,
      length: 0,
      mode: "unknown",
      looksValid: false,
      issues: ["missing"],
    };
  }

  const mode = stripeKeyMode(key);
  const prefix = keyPrefix(key);

  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    issues.push("expected_sk_prefix");
  }
  if (key.length < MIN_SECRET_LENGTH) {
    issues.push("too_short");
  } else if (key.length < SUSPICIOUSLY_SHORT) {
    issues.push("possibly_truncated");
  }
  if (/[^A-Za-z0-9_]/.test(key)) {
    issues.push("invalid_characters");
  }
  if (mode === "unknown") {
    issues.push("unknown_mode");
  }

  return {
    present: true,
    prefix,
    length: key.length,
    mode,
    looksValid: issues.length === 0,
    issues,
  };
}

/**
 * Safe log line — never includes key material beyond prefix.
 */
export function logStripeKeyDiagnostics(
  label: string,
  pub: StripeKeyInspection,
  secret?: StripeKeyInspection
): void {
  const parts = [
    `[stripe-keys] ${label}`,
    `pk present=${pub.present} prefix=${pub.prefix ?? "none"} len=${pub.length} mode=${pub.mode} valid=${pub.looksValid}`,
  ];
  if (pub.issues.length) parts.push(`pk_issues=${pub.issues.join(",")}`);
  if (secret) {
    parts.push(
      `sk present=${secret.present} prefix=${secret.prefix ?? "none"} len=${secret.length} mode=${secret.mode} valid=${secret.looksValid}`
    );
    if (secret.issues.length) parts.push(`sk_issues=${secret.issues.join(",")}`);
    if (
      pub.mode !== "unknown" &&
      secret.mode !== "unknown" &&
      pub.mode !== secret.mode
    ) {
      parts.push("MODE_MISMATCH=true");
    }
  }
  console.info(parts.join(" | "));
}

export function clientFacingKeyError(inspection: StripeKeyInspection): string {
  if (!inspection.present) {
    return "Stripe is not configured correctly. Please contact support.";
  }
  if (inspection.issues.includes("possibly_truncated") || inspection.issues.includes("too_short")) {
    return "Stripe is not configured correctly (incomplete API key). Please contact support.";
  }
  if (inspection.issues.includes("expected_pk_prefix")) {
    return "Stripe is not configured correctly (invalid publishable key). Please contact support.";
  }
  return "Stripe is not configured correctly. Please contact support.";
}
