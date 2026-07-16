export {
  sendBookingConfirmationEmail,
  sendSessionReminderEmail,
  sendRecordingReadyEmail,
  getProfileEmail,
  type SendResult,
} from "@/lib/email/send";
export { isResendConfigured, getFromAddress, getSiteUrl } from "@/lib/email/config";
