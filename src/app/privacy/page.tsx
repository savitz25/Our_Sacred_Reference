import { redirect } from "next/navigation";

/** Legacy route — canonical policy lives at /privacy-policy */
export default function PrivacyRedirectPage() {
  redirect("/privacy-policy");
}
