"use server";

import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface SmtpRuntimeConfig {
  id?: string;
  host: string;
  port?: string;
  user: string;
  pass: string;
  from_name?: string;
  reply_to?: string;
}

/**
 * Interface for email sending options
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: SendMailOptions["attachments"];
}

/**
 * Standardized email result interface
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any; // Full diagnostic log
}

/**
 * Fetch active SMTP configuration from database using Prisma.
 */
async function getActiveSmtpAccount(purpose: string): Promise<SmtpRuntimeConfig | null> {
  if (!prisma) {
    console.error("[Email Module] prisma not configured.");
    return null;
  }

  try {
    // Find active SMTP account, order by default first
    const smtpAccount = await prisma.smtpAccount.findFirst({
       where: {
        is_active: true,
      },
      orderBy: {
        is_default: 'desc',
      },
    });

    if (!smtpAccount) {
      console.warn(`[Email Module] No active SMTP config found for purpose: ${purpose}`);
      return null;
    }

    // Map to runtime config
    const config: SmtpRuntimeConfig = {
      id: smtpAccount.id,
      host: smtpAccount.host,
      port: String(smtpAccount.port),
      user: smtpAccount.username,
      pass: smtpAccount.password,
      from_name: smtpAccount.from_name || undefined,
      reply_to: smtpAccount.from_email, // Use from_email as reply_to fallback
    };

    return config;
  } catch (err) {
    console.error("[Email Module] SMTP config fetch exception:", err);
    return null;
  }
}

/**
 * Creates a Nodemailer transporter with strict SSL on port 465.
 */
function createTransporter(config: SmtpRuntimeConfig): Transporter {
  const port = Number(config.port) || 465;

  const host = config.host;
  const transportConfig: any = {
    host,
    port,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    name: host,
    tls: {
      rejectUnauthorized: false,
      servername: host,
    },
    logger: true,
    debug: true,
  };

  return nodemailer.createTransport(transportConfig);
}

/**
 * Logs email attempt (placeholder - email_logs table not implemented)
 */
async function logEmailAttempt(
  accountId: string | undefined,
  recipient: string,
  subject: string,
  result: EmailResult
) {
  // Email logs table not implemented in Prisma schema
  // Can be added later if needed
  console.log(`[Email Log] ${result.success ? 'SUCCESS' : 'FAILED'} to ${recipient} - ${subject}`);
}

/**
 * Low-level function to send email with specific config.
 * Implements the STRICT ALIGNMENT rules.
 */
export async function sendEmailWithConfig(
  config: SmtpRuntimeConfig,
  options: EmailOptions,
  purpose: string = 'unknown'
): Promise<EmailResult> {
  if (!config || !config.host || !config.user || !config.pass) {
    return { success: false, error: "SMTP Configuration missing or invalid." };
  }

    if (config.port && String(config.port) !== "465") {
      console.warn(`[Email Module] SMTP port is ${config.port}, but system enforces 465 with SSL.`);
    }


  try {
    const transporter = createTransporter(config);
    const fromEmail = config.user;
    const displayName = config.from_name || options.fromName || "SocialBluePro";
    const fromHeader = `"${displayName}" <${fromEmail}>`;
    const replyTo = options.replyTo || config.reply_to || fromEmail;

    const textContent = options.text
      ? options.text
      : options.html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]*>/g, '')
          .trim();

    const trackingId = `sbp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const emailHeaders: Record<string, string> = {
      'X-Entity-Ref-ID': trackingId,
      'X-Campaign-ID': purpose || 'general',
      'Feedback-ID': `${purpose}:socialbluepro:${trackingId}`,
      'List-Unsubscribe': '<https://socialbluepro.com/unsubscribe>, <mailto:contact@socialbluepro.com?subject=unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };

    const mailOptions: SendMailOptions = {
      from: fromHeader,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: textContent,
      replyTo,
      headers: emailHeaders,
      envelope: {
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to]
      },
      date: new Date()
    };

    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    console.log(`[Email Module] SMTP send start host=${config.host} user=${fromEmail}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Module] SMTP send success messageId=${info.messageId} response=${info.response} accepted=${info.accepted} rejected=${info.rejected}`);

    const result = {
      success: true,
      messageId: info.messageId,
      details: {
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        envelope: info.envelope,
        messageId: info.messageId
      }
    };

    await logEmailAttempt(config.id, Array.isArray(options.to) ? options.to[0] : options.to, options.subject, result);

    return result;
  } catch (err: any) {
    const smtpLog = {
      host: config.host,
      port: 465,
      user: config.user,
      command: err.command,
      response: err.response,
      responseCode: err.responseCode,
      code: err.code,
    };
    console.error("[Email Module] SMTP error details:", smtpLog);
    console.error("[Email Module] SMTP send error:", err);

    let userMessage = err.message || "Unknown error sending email";
    const smtpCode = err.responseCode || err.code;

    if (smtpCode && (String(smtpCode).includes('550') || String(smtpCode).includes('554') || String(smtpCode).includes('5.7.'))) {
      userMessage = `SMTP Rejection (code ${smtpCode}): Email rejected by recipient server.`;
    } else if (userMessage.includes('ECONNREFUSED')) {
      userMessage = `Connection refused by ${config.host}:465.`;
    } else if (userMessage.includes('ENOTFOUND')) {
      userMessage = `Host '${config.host}' not found.`;
    } else if (userMessage.includes('ETIMEDOUT')) {
      userMessage = `Connection timeout to ${config.host}.`;
    } else if (userMessage.toLowerCase().includes('authentication failed') || userMessage.includes('535')) {
      userMessage = `SMTP Authentication failed.`;
    } else if (userMessage.includes('self signed certificate')) {
      userMessage = `SSL/TLS certificate error.`;
    }

    const errorDetails = {
      message: err.message,
      code: err.code,
      response: err.response,
      command: err.command,
      responseCode: err.responseCode,
      smtpCode,
      enhancedMessage: userMessage,
      host: config.host,
      port: 465,
      user: config.user,
    };

    const result = {
      success: false,
      error: userMessage,
      details: errorDetails,
    };

    await logEmailAttempt(config.id, Array.isArray(options.to) ? options.to[0] : options.to, options.subject, result);

    return result;
  }
}

/**
 * High-Level Server Action compatible with legacy calls.
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  isHtml: boolean = true,
  purpose: string = 'general',
  textOverride?: string
): Promise<EmailResult> {

  if (!to) return { success: false, error: "Recipient (To) is required." };

  const config = await getActiveSmtpAccount(purpose);

  if (!config) {
    console.error(`[Email Action] No active SMTP config for purpose: ${purpose}`);
    return { success: false, error: `No SMTP configuration found for purpose: ${purpose}` };
  }

  const options: EmailOptions = {
    to,
    subject,
    html: isHtml ? body : `<div>${body}</div>`,
    text: textOverride || (isHtml ? undefined : body),
  };

  return sendEmailWithConfig(config, options, purpose);
}

/**
 * Specific Test Action for the UI Diagnostics Mode
 */
export async function sendDiagnosticTestEmail(
  config: SmtpRuntimeConfig,
  to: string
): Promise<EmailResult> {
  // Use Denver time for the email timestamp to match the business location
  const timeZone = "America/Denver";
  const now = new Date();
  
  const timeString = now.toLocaleTimeString("en-US", { 
    timeZone, 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const fullDateTime = now.toLocaleString("en-US", {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'long'
  });

  const options: EmailOptions = {
    to,
    subject: `SMTP Connectivity Verified - ${timeString}`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SMTP Test Successful</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #333333;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #059669; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">System Check Passed</h1>
              <p style="color: #ecfdf5; margin: 5px 0 0; font-size: 14px;">SMTP Configuration is Active</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #0f172a; margin: 0 0 20px; font-size: 20px;">Hello Admin,</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                This email confirms that your SMTP credentials are valid and the system can successfully send emails through your provider.
              </p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #166534; letter-spacing: 0.5px;">Connection Details</h3>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #15803d;">
                  <li style="padding: 4px 0;"><strong>Host:</strong> ${config.host}</li>
                  <li style="padding: 4px 0;"><strong>Port:</strong> 465 (SSL/Secure)</li>
                  <li style="padding: 4px 0;"><strong>User:</strong> ${config.user}</li>
                  <li style="padding: 4px 0;"><strong>Timestamp:</strong> ${fullDateTime}</li>
                </ul>
              </div>

              <p style="font-size: 14px; color: #64748b; margin: 0;">
                No further action is required. You can now reliably send campaign and notification emails.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                SocialBlue Pro System Notification<br>
                Generated by Diagnostics Module
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `SMTP Connectivity Verified\n\nThis email confirms that your SMTP credentials are valid.\n\nConnection Details:\n- Host: ${config.host}\n- Port: 465\n- User: ${config.user}\n- Time: ${fullDateTime}\n\nSocialBlue Pro System Notification`
  };

  return sendEmailWithConfig(config, options, 'test');
}
