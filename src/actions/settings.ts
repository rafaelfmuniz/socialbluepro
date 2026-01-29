"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import nodemailer from "nodemailer";
import type { TransportOptions, Transporter } from "nodemailer";
import type { AdminUser } from "./users";

export interface SmtpConfig {
  host: string;
  port: string;
  user: string;
  pass: string;
  secure: boolean;
}

export interface SmtpAccount {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string | null;
  is_default: boolean;
  is_active: boolean;
  purposes: string[];
  encryption: string;
  secure: boolean;
  reply_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: 'success' | 'failed';
  message_id: string;
  response_log: any;
  created_at: string;
}

export async function getLatestEmailLogs(limit = 10): Promise<EmailLog[]> {
  const session = await auth();
  if (!session) return [];

  try {
    const data = await prisma.emailLog.findMany({
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return data.map(log => ({
      ...log,
      status: log.status as 'success' | 'failed',
      created_at: log.created_at.toISOString()
    }));
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return [];
  }
}

export async function saveSmtpSettings(config: SmtpConfig) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!config.host || !config.port || !config.user || !config.pass) {
    throw new Error("All SMTP fields are required: host, port, username, password.");
  }

  const port = Number(config.port);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error("Invalid port number. Must be between 1 and 65535.");
  }

  let secure = config.secure;
  if (port === 465) {
    secure = true;
  } else if (port === 587) {
    secure = false;
  }

  const existingDefault = await prisma.smtpAccount.findFirst({
    where: { is_default: true }
  });

  const accountData = {
    name: existingDefault?.name || "SMTP Server",
    host: config.host.trim(),
    port,
    username: config.user.trim(),
    password: config.pass.trim(),
    from_email: config.user.trim(),
    is_default: true,
    is_active: true,
    purposes: ["general", "marketing", "transactional", "notifications", "password_reset"],
    encryption: 'auto' as const,
    secure,
    reply_to: null,
    updated_at: new Date(),
  };

  if (existingDefault) {
    await prisma.smtpAccount.update({
      where: { id: existingDefault.id },
      data: accountData
    });
  } else {
    await prisma.smtpAccount.create({
      data: {
        ...accountData,
        created_at: new Date()
      }
    });
  }

  return { success: true };
}

export async function getSmtpSettings(): Promise<SmtpConfig | null> {
  try {
    const account = await prisma.smtpAccount.findFirst({
      where: { is_default: true }
    });

    if (account) {
      return {
        host: account.host,
        port: account.port.toString(),
        user: account.username,
        pass: account.password,
        secure: Boolean(account.secure),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching SMTP settings:", error);
    return null;
  }
}

export async function testSmtpConnection(config: SmtpConfig) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!config.host || !config.port || !config.user || !config.pass) {
    return { success: false, message: "Missing SMTP configuration" };
  }

  const port = Number(config.port);
  if (isNaN(port) || port <= 0 || port > 65535) {
    return { success: false, message: "Invalid port number. Must be between 1 and 65535." };
  }

  const transportConfig: TransportOptions & Record<string, unknown> = {
    host: config.host,
    port,
    secure: Boolean(config.secure),
    auth: { user: config.user, pass: config.pass },
  };

  if (config.secure) {
    transportConfig.tls = { rejectUnauthorized: false };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    await transporter.verify();

    return { success: true, message: "Connection successful!" };
  } catch (error) {
    console.error("SMTP connection error:", error);
    const err = error as Error;
    let message = err.message || "Connection failed";
    
    if (message.includes("Invalid login")) {
      message = "Invalid username or password. Please check your credentials.";
    } else if (message.includes("ECONNREFUSED")) {
      message = `Connection refused by ${config.host}:${config.port}. Check if the SMTP server is running and the host/port are correct.`;
    } else if (message.includes("ETIMEDOUT")) {
      message = "Connection timed out. Check your network and firewall settings.";
    } else if (message.includes("self signed certificate")) {
      message = "Certificate error. If using a local SMTP server, you may need to set 'Secure' to false.";
    }
    return { success: false, message };
  }
}

export async function sendTestEmail(to: string) {
  const settings = await getSmtpSettings();
  if (!settings) return { success: false, message: "SMTP settings not found. Please save your SMTP configuration first." };

  if (!settings.host || !settings.port || !settings.user || !settings.pass) {
    return { success: false, message: "Incomplete SMTP configuration. Please fill all fields and save." };
  }

  const port = Number(settings.port);
  if (isNaN(port) || port <= 0 || port > 65535) {
    return { success: false, message: "Invalid port number in settings." };
  }

  const transportConfig: TransportOptions & Record<string, unknown> = {
    host: settings.host,
    port,
    secure: Boolean(settings.secure),
    auth: { user: settings.user, pass: settings.pass },
  };

  if (settings.secure) {
    transportConfig.tls = { rejectUnauthorized: false };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    const result = await transporter.sendMail({
      from: settings.user.includes('@') ? `"SocialBluePro" <${settings.user}>` : settings.user,
      replyTo: settings.user,
      to,
      subject: "Test Email - SocialBluePro",
      text: "If you are reading this, SMTP is working correctly.",
      html: "<p>If you are reading this, SMTP is working correctly.</p>"
    });

    return { success: true, message: `Email sent! Message ID: ${result.messageId}` };
  } catch (error) {
    console.error("Test email send error:", error);
    const err = error as Error & { code?: string; response?: string };
    let message = err.message || "Failed to send email";
    
    if (message.includes("Invalid login")) {
      message = "Invalid username or password. Please check your credentials.";
    } else if (message.includes("ECONNREFUSED")) {
      message = `Connection refused by ${settings.host}:${settings.port}. Check if the SMTP server is running and the host/port are correct.`;
    } else if (message.includes("ETIMEDOUT")) {
      message = "Connection timed out. Check your network and firewall settings.";
    } else if (message.includes("self signed certificate")) {
      message = "Certificate error. If using a local SMTP server, you may need to set 'Secure' to false.";
    } else if (message.includes("ENOTFOUND")) {
      message = `Host '${settings.host}' not found. Check the SMTP server address.`;
    } else if (message.includes("EAUTH")) {
      message = "Authentication failed. Please verify your username and password.";
    }
    return { success: false, message };
  }
}

export async function getSmtpAccounts(): Promise<SmtpAccount[]> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    const accounts = await prisma.smtpAccount.findMany({
      orderBy: { created_at: 'desc' }
    });

    return accounts.map(account => ({
      ...account,
      created_at: account.created_at.toISOString(),
      updated_at: account.updated_at.toISOString(),
      purposes: account.purposes || ["general"],
      encryption: account.encryption || 'auto',
      from_name: account.from_name || '',
      reply_to: account.reply_to || ''
    })) as SmtpAccount[];
  } catch (error) {
    console.error("Error fetching SMTP accounts:", error);
    return [];
  }
}

export async function getSmtpAccountForPurpose(purpose: string): Promise<SmtpAccount | null> {
  let account: SmtpAccount | null = null;
  let source = "none";

  try {
    const accounts = await prisma.smtpAccount.findMany({
      where: {
        purposes: {
          has: purpose
        }
      },
      orderBy: { is_default: 'desc' },
      take: 1
    });

    if (accounts && accounts.length > 0) {
      account = {
        ...accounts[0],
        created_at: accounts[0].created_at.toISOString(),
        updated_at: accounts[0].updated_at.toISOString(),
        encryption: accounts[0].encryption || 'auto',
      };
      source = "smtp_accounts (purpose match)";
    }
  } catch (err) {
    console.error("Error fetching SMTP by purpose:", err);
  }

  if (!account) {
    const defaultAccount = await prisma.smtpAccount.findFirst({
      where: { is_default: true }
    });

    if (defaultAccount) {
      account = {
        ...defaultAccount,
        created_at: defaultAccount.created_at.toISOString(),
        updated_at: defaultAccount.updated_at.toISOString(),
        encryption: defaultAccount.encryption || 'auto',
      };
      source = "smtp_accounts (default)";
    }
  }

  if (!account) {
    const legacyConfig = await getSmtpSettings();
    if (legacyConfig) {
       console.warn(`[SMTP CONFIG WARNING] Using legacy 'settings' table. Please migrate to 'smtp_accounts'.`);
       return {
         id: 'legacy',
         name: 'Legacy Config',
         host: legacyConfig.host,
         port: Number(legacyConfig.port),
         username: legacyConfig.user,
         password: legacyConfig.pass,
         secure: legacyConfig.secure,
         encryption: 'auto',
         from_name: '',
         reply_to: '',
         purposes: ['general'],
         is_default: true,
         from_email: legacyConfig.user,
         is_active: true,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };
    }
  }

  if (!account) {
    console.warn(`[SMTP CONFIG] No configuration found for purpose: ${purpose}`);
    return null;
  }

  console.log(`[SMTP CONFIG] Loaded account: ${account.name || 'Unnamed'} (ID: ${account.id}) from ${source}`);

  return account;
}

export async function saveSmtpAccount(account: Omit<SmtpAccount, "id" | "created_at" | "updated_at"> & { id?: string }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!account.host || !account.port || !account.username || !account.password) {
    throw new Error("All SMTP fields are required: host, port, username, password.");
  }

  const port = Number(account.port);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error("Invalid port number. Must be between 1 and 65535.");
  }

  let secure = account.secure;
  if (port === 465) {
    secure = true;
  } else if (port === 587) {
    secure = false;
  }

  const accountData = {
    name: account.name.trim(),
    host: account.host.trim(),
    port,
    username: account.username.trim(),
    password: account.password.trim(),
    secure,
    encryption: (account.encryption || 'auto') as string,
    from_name: account.from_name || '',
    reply_to: account.reply_to || '',
    from_email: account.from_email || account.username,
    purposes: account.purposes || ["general"],
    is_default: account.is_default || false,
    is_active: account.is_active !== undefined ? account.is_active : true,
    updated_at: new Date(),
  };

  if (account.id) {
    await prisma.smtpAccount.update({
      where: { id: account.id },
      data: accountData
    });
  } else {
    await prisma.smtpAccount.create({
      data: {
        ...accountData,
        created_at: new Date()
      }
    });
  }

  return { success: true };
}

export async function deleteSmtpAccount(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.smtpAccount.delete({
    where: { id }
  });

  return { success: true };
}

export async function validateSmtpWithRealTest(purpose: string = 'general', testEmail: string): Promise<{
  success: boolean;
  message: string;
  details: {
    connectionTest: boolean;
    connectionMessage: string;
    emailTest: boolean;
    emailMessage: string;
    configUsed: SmtpConfig | null;
    errorDetails?: unknown;
  };
}> {

  
  try {
    const config = await getSmtpAccountForPurpose(purpose);
    if (!config) {
      return {
        success: false,
        message: `No SMTP configuration found for purpose: ${purpose}`,
        details: {
          connectionTest: false,
          connectionMessage: 'No configuration',
          emailTest: false,
          emailMessage: 'No configuration',
          configUsed: null
        }
      };
    }


    let connectionSuccess = false;
    let connectionMessage = '';
    let connectionError: unknown = null;
    
    try {
      const transportOptions: TransportOptions & Record<string, unknown> = {
        host: config.host,
        port: Number(config.port),
        secure: Boolean(config.secure),
        auth: { user: config.username, pass: config.password },
      };
      if (config.secure) {
        transportOptions.tls = { rejectUnauthorized: false };
      }
      const transporter = nodemailer.createTransport(transportOptions);

      await transporter.verify();
      connectionSuccess = true;
      connectionMessage = `Connection successful to ${config.host}:${config.port}`;

    } catch (err) {
      const error = err as Error;
      connectionSuccess = false;
      connectionMessage = `Connection failed: ${error.message}`;
      connectionError = err;
      console.error(`[SMTP VALIDATION] Connection test failed:`, error);
      
      return {
        success: false,
        message: `SMTP validation failed at connection test`,
        details: {
          connectionTest: false,
          connectionMessage,
          emailTest: false,
          emailMessage: 'Not attempted due to connection failure',
          configUsed: null,
          errorDetails: connectionError
        }
      };
    }

    let emailSuccess = false;
    let emailMessage = '';
    let errorDetails: unknown = null;
    
    try {
      const transportOptions: TransportOptions & Record<string, unknown> = {
        host: config.host,
        port: Number(config.port),
        secure: Boolean(config.secure),
        auth: { user: config.username, pass: config.password },
      };
      if (config.secure) {
        transportOptions.tls = { rejectUnauthorized: false };
      }
      const transporter = nodemailer.createTransport(transportOptions);

      const startTime = Date.now();
      const result = await transporter.sendMail({
        from: `"SocialBluePro" <${config.from_email}>`,
        replyTo: config.reply_to || config.from_email,
        to: testEmail,
        subject: `SMTP Validation Test - ${new Date().toISOString()}`,
        text: `This is a test email to validate SMTP configuration for purpose: ${purpose}\n\nConfiguration used:\nHost: ${config.host}\nPort: ${config.port}\nUser: ${config.username}\nSecure: ${config.secure}\nTime: ${new Date().toISOString()}`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>SMTP Validation Test</h2>
                <p>This is a test email to validate SMTP configuration for purpose: <strong>${purpose}</strong></p>
                <h3>Configuration used:</h3>
                <ul>
                  <li><strong>Host:</strong> ${config.host}</li>
                  <li><strong>Port:</strong> ${config.port}</li>
                  <li><strong>User:</strong> ${config.username}</li>
                  <li><strong>Secure:</strong> ${config.secure}</li>
                  <li><strong>Time:</strong> ${new Date().toISOString()}</li>
                </ul>
                <p>If you receive this email, SMTP configuration is working correctly.</p>
              </div>`,
        headers: {
            'X-Entity-Ref-ID': new Date().getTime().toString(),
        }
      });
      
      const endTime = Date.now();
      emailSuccess = true;
      emailMessage = `Email sent successfully! Message ID: ${result.messageId}, Response: ${result.response}, Time: ${endTime - startTime}ms`;

    } catch (emailError) {
      const err = emailError as Error & { code?: string; response?: string; responseCode?: number };
      emailSuccess = false;
      emailMessage = `Email sending failed: ${err.message}`;
      errorDetails = { message: err.message, code: err.code, response: err.response };
      console.error(`[SMTP VALIDATION] Email test failed:`, err);
    }

    const overallSuccess = connectionSuccess && emailSuccess;
    
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? `SMTP validation successful! Connection and email test passed.`
        : `SMTP validation partially or fully failed.`,
      details: {
        connectionTest: connectionSuccess,
        connectionMessage,
        emailTest: emailSuccess,
        emailMessage,
        configUsed: null,
        ...(errorDetails ? { errorDetails } : {})
      }
    };

  } catch (error) {
    const err = error as Error;
    console.error(`[SMTP VALIDATION] Unexpected error during validation:`, err);
    return {
      success: false,
      message: `Unexpected error during SMTP validation: ${err.message}`,
      details: {
        connectionTest: false,
        connectionMessage: 'Validation process failed',
        emailTest: false,
        emailMessage: 'Validation process failed',
        configUsed: null,
        errorDetails: err
      }
    };
  }
}

export interface TrackingPixel {
  id: string;
  name: string;
  type: 'google_analytics' | 'google_ads' | 'facebook_pixel' | 'tiktok_pixel' | 'custom';
  code: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecaptchaConfig {
  id: string;
  provider: 'google_v2' | 'google_v3' | 'cloudflare_turnstile' | 'hcaptcha';
  site_key: string;
  secret_key: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function saveRecaptchaConfig(
  siteKey: string,
  secretKey: string,
  isEnabled: boolean,
  provider: RecaptchaConfig['provider'] = 'google_v2'
) {
  console.log("--- DEBUG SAVE RECAPTCHA ---");
  console.log("Received:", { siteKey, secretKey, isEnabled, provider });

  try {
    const session = await auth();
    if (!session) {
        console.log("Error: Unauthorized session");
        return { success: false, error: "Unauthorized" };
    }

    if (isEnabled && (!siteKey || !secretKey)) {
      console.log("Error: Missing keys while enabled");
      return { success: false, error: "Both site key and secret key are required to enable reCAPTCHA." };
    }

    const payload = {
      id: "main",
      provider,
      site_key: siteKey ? siteKey.trim() : "",
      secret_key: secretKey ? secretKey.trim() : "",
      is_enabled: isEnabled,
      updated_at: new Date(),
    };

    console.log("Upserting Payload:", payload);

    await prisma.recaptchaSetting.upsert({
      where: { id: "main" },
      update: payload,
      create: {
        ...payload,
        created_at: new Date()
      }
    });

    console.log("Save Success!");
    return { success: true };
  } catch (err: any) {
    console.error("Save Recaptcha Exception:", err);
    return { success: false, error: err.message || "Unexpected error saving reCAPTCHA" };
  }
}

export async function getRecaptchaConfig(): Promise<RecaptchaConfig | null> {
  try {
    const data = await prisma.recaptchaSetting.findUnique({
      where: { id: "main" }
    });

    if (data) {
      return {
        id: String(data.id),
        provider: (data.provider || 'google_v2') as any,
        site_key: String(data.site_key || ''),
        secret_key: String(data.secret_key || ''),
        is_enabled: Boolean(data.is_enabled),
        created_at: data.created_at.toISOString(),
        updated_at: data.updated_at.toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.error("Exception fetching reCAPTCHA config:", err);
    return null;
  }
}

export async function getTrackingPixels(): Promise<TrackingPixel[]> {
  try {
    const data = await prisma.trackingPixel.findMany({
      orderBy: { created_at: 'desc' }
    });

    return data.map(pixel => ({
      ...pixel,
      type: pixel.type as 'google_analytics' | 'google_ads' | 'facebook_pixel' | 'tiktok_pixel' | 'custom',
      created_at: pixel.created_at.toISOString(),
      updated_at: pixel.updated_at.toISOString()
    })) as TrackingPixel[];
  } catch (error) {
    console.error("Error fetching tracking pixels:", error);
    return [];
  }
}

export async function saveTrackingPixel(pixel: Omit<TrackingPixel, 'id' | 'created_at' | 'updated_at'>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!pixel.name || !pixel.code) {
    throw new Error("Pixel name and code are required.");
  }

  const pixelData = {
    name: pixel.name.trim(),
    type: pixel.type,
    code: pixel.code.trim(),
    is_enabled: pixel.is_enabled !== undefined ? pixel.is_enabled : true,
    updated_at: new Date(),
  };

  await prisma.trackingPixel.create({
    data: {
      ...pixelData,
      created_at: new Date()
    }
  });

  return { success: true };
}

export async function updateTrackingPixel(id: string, pixel: Omit<TrackingPixel, 'id' | 'created_at' | 'updated_at'>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const pixelData = {
    name: pixel.name.trim(),
    type: pixel.type,
    code: pixel.code.trim(),
    is_enabled: pixel.is_enabled !== undefined ? pixel.is_enabled : true,
    updated_at: new Date(),
  };

  await prisma.trackingPixel.update({
    where: { id },
    data: pixelData
  });

  return { success: true };
}

export async function deleteTrackingPixel(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.trackingPixel.delete({
    where: { id }
  });

  return { success: true };
}

export async function toggleTrackingPixel(id: string, isEnabled: boolean) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.trackingPixel.update({
    where: { id },
    data: { is_enabled: isEnabled, updated_at: new Date() }
  });

  return { success: true };
}


export async function getAllSettingsData() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const [smtpAccounts, users, recaptcha, pixels] = await Promise.all([
    prisma.smtpAccount.findMany({
      orderBy: { created_at: 'desc' }
    }),
    prisma.adminUser.findMany({
      orderBy: { created_at: 'desc' }
    }),
    prisma.recaptchaSetting.findUnique({
      where: { id: "main" }
    }),
    prisma.trackingPixel.findMany({
      orderBy: { created_at: 'desc' }
    })
  ]);

  let smtpConfig: SmtpConfig = { host: "", port: "", user: "", pass: "", secure: false };

  const defaultAccount = smtpAccounts.find((a) => a.is_default);
  if (defaultAccount) {
    smtpConfig = {
      host: defaultAccount.host,
      port: defaultAccount.port.toString(),
      user: defaultAccount.username,
      pass: defaultAccount.password,
      secure: Boolean(defaultAccount.secure),
    };
  }

  const recaptchaData = recaptcha ? {
    id: String(recaptcha.id),
    provider: (recaptcha.provider || 'google_v2') as any,
    site_key: String(recaptcha.site_key || ''),
    secret_key: String(recaptcha.secret_key || ''),
    is_enabled: Boolean(recaptcha.is_enabled),
    created_at: recaptcha.created_at.toISOString(),
    updated_at: recaptcha.updated_at.toISOString(),
  } : null;

  return {
    smtp: smtpConfig,
    accounts: smtpAccounts.map((account) => ({
      ...account,
      created_at: account.created_at.toISOString(),
      updated_at: account.updated_at.toISOString(),
      purposes: account.purposes || ["general"],
      encryption: account.encryption || 'auto'
    })),
    users: users.map((user) => ({
      ...user,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      locked_until: user.locked_until?.toISOString() || null
    })),
    recaptcha: recaptchaData,
    pixels: pixels.map((pixel) => ({
      ...pixel,
      created_at: pixel.created_at.toISOString(),
      updated_at: pixel.updated_at.toISOString(),
      type: pixel.type as TrackingPixel['type']
    }))
  };
}
