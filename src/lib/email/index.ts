export {
  sendBookingConfirmationEmail,
  sendSessionReminderEmail,
  sendSessionRescheduledEmail,
  sendRecordingReadyEmail,
  getProfileEmail,
  type SendResult,
} from "@/lib/email/send";
export {
  isResendConfigured,
  getFromAddress,
  getPractitionerNotifyEmail,
  appointmentRecipients,
  getSiteUrl,
} from "@/lib/email/config";
