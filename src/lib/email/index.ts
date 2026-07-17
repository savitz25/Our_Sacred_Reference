export {
  sendBookingConfirmationEmail,
  sendSessionReminderEmail,
  sendSessionRescheduledEmail,
  sendRecordingReadyEmail,
  sendEmergencyRequestToPractitioner,
  sendEmergencyProposalToClient,
  sendEmergencyDeclinedToPractitioner,
  sendEmergencyAcceptedToPractitioner,
  getProfileEmail,
  type SendResult,
} from "@/lib/email/send";
export {
  isResendConfigured,
  getFromAddress,
  getPractitionerNotifyEmail,
  appointmentRecipients,
  getSiteUrl,
  absoluteUrl,
  PRODUCTION_SITE_URL,
} from "@/lib/email/config";
