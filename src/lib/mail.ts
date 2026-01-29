import { sendEmail as actionSendEmail } from "@/actions/email";

export async function sendEmail({
  to,
  subject,
  html,
  text,
  purpose = "general"
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  purpose?: string;
}) {
  return actionSendEmail(Array.isArray(to) ? to.join(",") : to, subject, html, true, purpose, text);
}
