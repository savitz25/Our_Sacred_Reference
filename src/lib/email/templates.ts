import { BRAND, getSiteUrl } from "@/lib/email/config";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(opts: {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
}): string {
  const site = getSiteUrl();
  const cta =
    opts.ctaLabel && opts.ctaHref
      ? `
      <tr>
        <td align="center" style="padding: 28px 0 8px;">
          <a href="${escapeHtml(opts.ctaHref)}"
             style="display:inline-block;background:linear-gradient(135deg,#b8860b,#d4a017,#e8c04a);color:${BRAND.forest};text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px;">
            ${escapeHtml(opts.ctaLabel)}
          </a>
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <!--[if mso]><style>body,table,td{font-family:Georgia,serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(opts.preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.cream};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#fffdf9;border-radius:16px;overflow:hidden;border:1px solid rgba(10,61,51,0.1);">
          <tr>
            <td style="background:${BRAND.forest};padding:28px 32px;text-align:center;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND.cream};letter-spacing:0.02em;">
                ${BRAND.name}
              </p>
              <p style="margin:8px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:12px;color:${BRAND.gold};letter-spacing:0.12em;text-transform:uppercase;">
                Mytho-Shamanic Somatic Healing
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:${BRAND.ink};">
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:500;color:${BRAND.forest};line-height:1.3;">
                ${escapeHtml(opts.title)}
              </h1>
              <div style="font-size:15px;line-height:1.65;color:${BRAND.ink};">
                ${opts.bodyHtml}
              </div>
            </td>
          </tr>
          ${cta}
          <tr>
            <td style="padding:24px 32px 32px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">
              ${
                opts.footerNote
                  ? `<p style="margin:0 0 12px;">${opts.footerNote}</p>`
                  : ""
              }
              <p style="margin:0;border-top:1px solid rgba(10,61,51,0.1);padding-top:16px;">
                Sacred Reference offers alternative health and embodied coaching for personal growth — not licensed medical or clinical therapy.
                <a href="${site}/consent" style="color:${BRAND.teal};">Informed Consent</a>
              </p>
              <p style="margin:12px 0 0;">
                <a href="${site}" style="color:${BRAND.teal};text-decoration:none;">${site.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function bookingConfirmationHtml(input: {
  fullName: string;
  sessionTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
}): string {
  const site = getSiteUrl();
  const when = input.scheduledAt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const first = input.fullName.split(" ")[0] || "there";
  const portal = `${site}/portal`;
  const join = `${site}/portal/session/${input.sessionId}`;

  return layout({
    preheader: `Confirmed: ${input.sessionTitle} on ${when}`,
    title: "Your session is confirmed",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px;">
        Thank you for booking with Sacred Reference. Your session has been confirmed and your portal account is ready.
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">${escapeHtml(input.sessionTitle)}</strong><br/>
            <span style="color:${BRAND.muted};">${escapeHtml(when)}</span><br/>
            <span style="color:${BRAND.muted};">${input.durationMinutes} minutes · Online video on Sacred Reference</span>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 14px;">
        Use this link when it is time. If you open it early, you will see a peaceful waiting page with a countdown—you will not leave Sacred Reference.
      </p>
      <p style="margin:0 0 14px;">
        <a href="${escapeHtml(join)}" style="color:${BRAND.teal};word-break:break-all;">${escapeHtml(join)}</a>
      </p>
      <p style="margin:0;">
        With presence,<br/>
        <em style="color:${BRAND.forest};">Michele &amp; Sacred Reference</em>
      </p>
    `,
    ctaLabel: "Open client portal",
    ctaHref: portal,
    footerNote:
      "If you need to reschedule, sign in to the portal or reply to this email.",
  });
}

function formatSessionWhen(d: Date): string {
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Client-facing ~1 hour pre-session reminder */
export function sessionReminderHtml(input: {
  fullName: string;
  sessionTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
  minutesUntil?: number;
  hoursUntil?: number;
  notes?: string | null;
}): string {
  const site = getSiteUrl();
  const when = formatSessionWhen(input.scheduledAt);
  const first = input.fullName.split(" ")[0] || "there";
  const join = `${site}/portal/session/${input.sessionId}`;
  const minutes =
    input.minutesUntil ??
    (input.hoursUntil != null ? input.hoursUntil * 60 : 60);
  const timePhrase =
    minutes <= 75
      ? "about 1 hour"
      : `about ${Math.max(1, Math.round(minutes / 60))} hour(s)`;

  const clientNotes = sanitizeClientFacingNotes(input.notes);
  const notesBlock = clientNotes
    ? `<p style="margin:0 0 14px;font-size:14px;color:${BRAND.muted};">
         <strong style="color:${BRAND.forest};">Your notes:</strong><br/>
         ${escapeHtml(clientNotes)}
       </p>`
    : "";

  return layout({
    preheader: `Reminder: ${input.sessionTitle} in ${timePhrase}`,
    title: "Your session begins in about 1 hour",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px;">
        A gentle reminder that your Sacred Reference session begins in
        <strong style="color:${BRAND.forest};">${escapeHtml(timePhrase)}</strong>.
        Take a few breaths, find a quiet space, and arrive when you are ready.
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">${escapeHtml(input.sessionTitle)}</strong><br/>
            <span style="color:${BRAND.muted};">${escapeHtml(when)}</span><br/>
            <span style="color:${BRAND.muted};">${input.durationMinutes} minutes · Secure encrypted video on Sacred Reference</span>
          </td>
        </tr>
      </table>
      ${notesBlock}
      <p style="margin:0 0 14px;">
        Use the button below to open your session room. If you arrive early, a serene countdown will hold the space until the join window opens (about 15 minutes before start)—you will stay on Sacred Reference the whole time.
      </p>
      <p style="margin:0 0 14px;font-size:13px;color:${BRAND.muted};word-break:break-all;">
        Direct link: <a href="${escapeHtml(join)}" style="color:${BRAND.teal};">${escapeHtml(join)}</a>
      </p>
      <p style="margin:0;">
        With care,<br/>
        <em style="color:${BRAND.forest};">Michele &amp; Sacred Reference</em>
      </p>
    `,
    ctaLabel: "Start Session",
    ctaHref: join,
    footerNote:
      "Need to reschedule? Reply to this email or sign in to your portal.",
  });
}

/** Practitioner (Michele) ~1 hour admin reminder — personalized with client details */
export function practitionerSessionReminderHtml(input: {
  clientName: string;
  clientEmail: string;
  sessionTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
  minutesUntil?: number;
  notes?: string | null;
}): string {
  const site = getSiteUrl();
  const when = formatSessionWhen(input.scheduledAt);
  const join = `${site}/portal/session/${input.sessionId}`;
  const admin = `${site}/admin`;
  const minutes = input.minutesUntil ?? 60;
  const timePhrase =
    minutes <= 75
      ? "about 1 hour"
      : `about ${Math.max(1, Math.round(minutes / 60))} hour(s)`;

  const sessionNotes = sanitizeClientFacingNotes(input.notes);
  const notesBlock = sessionNotes
    ? `<p style="margin:12px 0 0;font-size:13px;color:${BRAND.muted};">
         <strong style="color:${BRAND.forest};">Session notes:</strong><br/>
         ${escapeHtml(sessionNotes)}
       </p>`
    : "";

  return layout({
    preheader: `In ${timePhrase}: ${input.sessionTitle} with ${input.clientName}`,
    title: "Upcoming session in about 1 hour",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear Michele,</p>
      <p style="margin:0 0 14px;">
        You have a session starting in
        <strong style="color:${BRAND.forest};">${escapeHtml(timePhrase)}</strong>.
        A matching reminder has been sent to your client.
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">${escapeHtml(input.sessionTitle)}</strong><br/>
            <span style="color:${BRAND.muted};">${escapeHtml(when)}</span><br/>
            <span style="color:${BRAND.muted};">${input.durationMinutes} minutes</span><br/><br/>
            <strong style="color:${BRAND.forest};">Client</strong><br/>
            <span style="color:${BRAND.ink};">${escapeHtml(input.clientName)}</span><br/>
            <a href="mailto:${escapeHtml(input.clientEmail)}" style="color:${BRAND.teal};">${escapeHtml(input.clientEmail)}</a>
            ${notesBlock}
          </td>
        </tr>
      </table>
      <p style="margin:0 0 14px;">
        You may enter the room early to prepare. Clients can join from about 15 minutes before the scheduled start.
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};word-break:break-all;">
        Session room: <a href="${escapeHtml(join)}" style="color:${BRAND.teal};">${escapeHtml(join)}</a>
      </p>
      <p style="margin:0;font-size:13px;color:${BRAND.muted};word-break:break-all;">
        Admin dashboard: <a href="${escapeHtml(admin)}" style="color:${BRAND.teal};">${escapeHtml(admin)}</a>
      </p>
    `,
    ctaLabel: "Open session room",
    ctaHref: join,
    footerNote:
      "This is an internal appointment notification from Sacred Reference.",
  });
}

/** Strip internal cron/system markers from notes before emailing */
function sanitizeClientFacingNotes(notes?: string | null): string {
  if (!notes?.trim()) return "";
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("[reminder") &&
        !line.startsWith("[system")
    )
    .join("\n")
    .trim()
    .slice(0, 800);
}

export function recordingReadyHtml(input: {
  fullName: string;
  videoTitle: string;
  libraryUrl: string;
  playUrl?: string | null;
}): string {
  const first = input.fullName.split(" ")[0] || "there";
  const playNote = input.playUrl
    ? `<p style="margin:0 0 14px;font-size:13px;color:${BRAND.muted};">
         A private playback link is available for a limited time (opens the video after sign-in if needed):
         <br/><a href="${escapeHtml(input.playUrl)}" style="color:${BRAND.teal};word-break:break-all;">Open private recording link</a>
       </p>`
    : "";

  return layout({
    preheader: `Your recording “${input.videoTitle}” is ready in your library`,
    title: "Your session recording is ready",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px;">
        Your recording has been processed and added to your private session library.
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">${escapeHtml(input.videoTitle)}</strong><br/>
            <span style="color:${BRAND.muted};">Private · secure library access only</span>
          </td>
        </tr>
      </table>
      ${playNote}
      <p style="margin:0 0 14px;">
        Sign in to revisit the felt sense of your work together — your evolving embodied archive.
      </p>
      <p style="margin:0;">
        With presence,<br/>
        <em style="color:${BRAND.forest};">Michele &amp; Sacred Reference</em>
      </p>
    `,
    ctaLabel: "Open session library",
    ctaHref: input.libraryUrl,
    footerNote:
      "Recordings are private. Please do not forward or publish session media.",
  });
}
