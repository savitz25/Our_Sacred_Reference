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

/** Client-facing reschedule confirmation */
export function sessionRescheduledHtml(input: {
  fullName: string;
  sessionTitle: string;
  previousScheduledAt: Date;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
}): string {
  const site = getSiteUrl();
  const when = formatSessionWhen(input.scheduledAt);
  const previousWhen = formatSessionWhen(input.previousScheduledAt);
  const first = input.fullName.split(" ")[0] || "there";
  const join = `${site}/portal/session/${input.sessionId}`;
  const portal = `${site}/portal`;

  return layout({
    preheader: `Rescheduled: ${input.sessionTitle} → ${when}`,
    title: "Your session has been rescheduled",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px;">
        Your Sacred Reference session has been moved to a new time. Your session
        room, library, and any past recordings remain linked to this same session.
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">${escapeHtml(input.sessionTitle)}</strong><br/>
            <span style="color:${BRAND.muted};">Previously: ${escapeHtml(previousWhen)}</span><br/>
            <strong style="color:${BRAND.forest};">New time: ${escapeHtml(when)}</strong><br/>
            <span style="color:${BRAND.muted};">${input.durationMinutes} minutes · Secure video on Sacred Reference</span>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 14px;">
        You will receive a gentle reminder about one hour before the new start time
        (when email is configured). Open the room from your portal when it is time.
      </p>
      <p style="margin:0 0 14px;font-size:13px;color:${BRAND.muted};word-break:break-all;">
        Session link: <a href="${escapeHtml(join)}" style="color:${BRAND.teal};">${escapeHtml(join)}</a>
      </p>
      <p style="margin:0;">
        With care,<br/>
        <em style="color:${BRAND.forest};">Michele &amp; Sacred Reference</em>
      </p>
    `,
    ctaLabel: "Open client portal",
    ctaHref: portal,
    footerNote:
      "Need to change again? Sign in to the portal and choose Reschedule on your upcoming session.",
  });
}

/** Practitioner notification when a client reschedules */
export function practitionerSessionRescheduledHtml(input: {
  clientName: string;
  clientEmail: string;
  sessionTitle: string;
  previousScheduledAt: Date;
  scheduledAt: Date;
  durationMinutes: number;
  sessionId: string;
}): string {
  const site = getSiteUrl();
  const when = formatSessionWhen(input.scheduledAt);
  const previousWhen = formatSessionWhen(input.previousScheduledAt);
  const join = `${site}/portal/session/${input.sessionId}`;
  const admin = `${site}/admin`;

  return layout({
    preheader: `Rescheduled: ${input.clientName} → ${when}`,
    title: "Session rescheduled",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear Michele,</p>
      <p style="margin:0 0 14px;">
        A client has rescheduled their session. The same session record is kept
        (recordings and history stay intact). A 1-hour reminder will fire for the new time.
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">${escapeHtml(input.sessionTitle)}</strong><br/>
            <span style="color:${BRAND.muted};">Previously: ${escapeHtml(previousWhen)}</span><br/>
            <strong style="color:${BRAND.forest};">New time: ${escapeHtml(when)}</strong><br/>
            <span style="color:${BRAND.muted};">${input.durationMinutes} minutes</span><br/><br/>
            <strong style="color:${BRAND.forest};">Client</strong><br/>
            <span style="color:${BRAND.ink};">${escapeHtml(input.clientName)}</span><br/>
            <a href="mailto:${escapeHtml(input.clientEmail)}" style="color:${BRAND.teal};">${escapeHtml(input.clientEmail)}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};word-break:break-all;">
        Session room: <a href="${escapeHtml(join)}" style="color:${BRAND.teal};">${escapeHtml(join)}</a>
      </p>
      <p style="margin:0;font-size:13px;color:${BRAND.muted};word-break:break-all;">
        Admin: <a href="${escapeHtml(admin)}" style="color:${BRAND.teal};">${escapeHtml(admin)}</a>
      </p>
    `,
    ctaLabel: "Open session room",
    ctaHref: join,
    footerNote: "Internal appointment notification from Sacred Reference.",
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

/** Notify Michele of a new emergency request */
export function emergencyRequestPractitionerHtml(input: {
  clientName: string;
  clientEmail: string;
  reason?: string | null;
  adminUrl: string;
}): string {
  const reasonBlock = input.reason?.trim()
    ? `<p style="margin:12px 0 0;font-size:14px;color:${BRAND.muted};"><strong style="color:${BRAND.forest};">Client note:</strong><br/>${escapeHtml(input.reason.trim())}</p>`
    : `<p style="margin:12px 0 0;font-size:13px;color:${BRAND.muted};">No additional note was provided.</p>`;

  return layout({
    preheader: `Emergency session request from ${input.clientName}`,
    title: "Emergency session request",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear Michele,</p>
      <p style="margin:0 0 14px;">
        A client has submitted an <strong style="color:${BRAND.forest};">Emergency Session Request</strong>
        and is asking for an immediate or near-term session.
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">${escapeHtml(input.clientName)}</strong><br/>
            <a href="mailto:${escapeHtml(input.clientEmail)}" style="color:${BRAND.teal};">${escapeHtml(input.clientEmail)}</a>
            ${reasonBlock}
          </td>
        </tr>
      </table>
      <p style="margin:0 0 14px;">
        Open the admin dashboard to accept and propose either an instant meeting or a short delay (15–60 minutes).
      </p>
    `,
    ctaLabel: "Open admin — emergency requests",
    ctaHref: input.adminUrl,
    footerNote: "Internal notification from Sacred Reference.",
  });
}

/** Client: Michele proposed a time — Accept / Decline */
export function emergencyProposalClientHtml(input: {
  fullName: string;
  proposedAt: Date;
  delayMinutes: number;
  acceptUrl: string;
  declineUrl: string;
  isInstant: boolean;
}): string {
  const first = input.fullName.split(" ")[0] || "there";
  const when = input.proposedAt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const timing = input.isInstant
    ? "Michele can meet with you <strong>now</strong> (instant meeting)."
    : `Michele can meet with you in about <strong>${input.delayMinutes} minutes</strong>.`;

  return layout({
    preheader: input.isInstant
      ? "Michele is available for an emergency session now"
      : `Michele proposed an emergency session at ${when}`,
    title: "Your emergency session proposal",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(first)},</p>
      <p style="margin:0 0 14px;">
        Michele has responded to your emergency session request. ${timing}
      </p>
      <table role="presentation" width="100%" style="background:${BRAND.cream};border-radius:12px;margin:16px 0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.6;">
            <strong style="color:${BRAND.forest};">Proposed time</strong><br/>
            <span style="color:${BRAND.ink};">${escapeHtml(when)}</span><br/>
            <span style="color:${BRAND.muted};">${input.isInstant ? "Start immediately after you accept" : `${input.delayMinutes} minute delay · secure video room`}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 18px;">
        Please accept or decline this proposal. If you accept an instant meeting, you will enter the secure video room right away.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding:4px;">
            <a href="${escapeHtml(input.acceptUrl)}"
               style="display:inline-block;background:linear-gradient(135deg,#b8860b,#d4a017,#e8c04a);color:${BRAND.forest};text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px;margin:4px;">
              Accept session
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 4px 4px;">
            <a href="${escapeHtml(input.declineUrl)}"
               style="display:inline-block;background:transparent;color:${BRAND.muted};text-decoration:underline;font-size:14px;padding:8px 16px;">
              Decline this time
            </a>
          </td>
        </tr>
      </table>
    `,
    footerNote:
      "If the buttons do not work, sign in to your portal and open the emergency request notification.",
  });
}

/** Michele: client declined the proposal */
export function emergencyDeclinedPractitionerHtml(input: {
  clientName: string;
  clientEmail: string;
  proposedAt?: Date | null;
  adminUrl: string;
}): string {
  const when = input.proposedAt
    ? input.proposedAt.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "the proposed time";

  return layout({
    preheader: `${input.clientName} declined the emergency session proposal`,
    title: "Emergency proposal declined",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear Michele,</p>
      <p style="margin:0 0 14px;">
        <strong style="color:${BRAND.forest};">${escapeHtml(input.clientName)}</strong>
        (<a href="mailto:${escapeHtml(input.clientEmail)}" style="color:${BRAND.teal};">${escapeHtml(input.clientEmail)}</a>)
        declined the emergency session proposal for ${escapeHtml(when)}.
      </p>
      <p style="margin:0;">You may follow up from the admin dashboard or by email if appropriate.</p>
    `,
    ctaLabel: "Open admin",
    ctaHref: input.adminUrl,
    footerNote: "Internal notification from Sacred Reference.",
  });
}

/** Michele: client accepted */
export function emergencyAcceptedPractitionerHtml(input: {
  clientName: string;
  clientEmail: string;
  proposedAt: Date;
  isInstant: boolean;
  sessionUrl: string;
}): string {
  const when = input.proposedAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return layout({
    preheader: `${input.clientName} accepted the emergency session`,
    title: "Emergency session accepted",
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear Michele,</p>
      <p style="margin:0 0 14px;">
        <strong style="color:${BRAND.forest};">${escapeHtml(input.clientName)}</strong>
        accepted the emergency session
        ${input.isInstant ? "(instant — join now)" : `scheduled for ${escapeHtml(when)}`}.
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};">
        Client: <a href="mailto:${escapeHtml(input.clientEmail)}" style="color:${BRAND.teal};">${escapeHtml(input.clientEmail)}</a>
      </p>
    `,
    ctaLabel: input.isInstant ? "Enter session room" : "Open session room",
    ctaHref: input.sessionUrl,
    footerNote: "Internal notification from Sacred Reference.",
  });
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
