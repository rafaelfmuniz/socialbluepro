"use server";

import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

// Security: No hardcoded credentials - all credentials must be set via database
const MAX_FAILED_ATTEMPTS = 5;

const LOCKOUT_TIERS = [
  { attempts: 3, minutes: 1 },
  { attempts: 5, minutes: 5 },
  { attempts: 8, minutes: 15 },
  { attempts: 12, minutes: 30 },
  { attempts: 20, minutes: 60 },
];

const COOLDOWN_RESET_HOURS = 24;

interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  };
  attemptsRemaining?: number;
  lockedUntil?: string;
  cooldownMinutes?: number;
  error?: string;
}

function getLockoutDuration(totalFailedAttempts: number): number {
  for (const tier of LOCKOUT_TIERS) {
    if (totalFailedAttempts >= tier.attempts) {
      return tier.minutes;
    }
  }
  return 0;
}

function shouldDecrementAttempts(lastFailedAttempt: Date | null): boolean {
  if (!lastFailedAttempt) return false;
  
  const hoursSinceLastFail = (Date.now() - lastFailedAttempt.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastFail >= COOLDOWN_RESET_HOURS;
}

async function decrementFailedAttempts(userId: string) {
  await prisma.adminUser.update({
    where: { id: userId },
    data: { failed_attempts: Math.max(0, (await prisma.adminUser.findUnique({ where: { id: userId }, select: { failed_attempts: true } }))?.failed_attempts || 0) - 1 }
  });
}

export async function checkLoginAttempt(email: string, password: string | null, captchaToken?: string): Promise<LoginResult | null> {
  try {
    console.log(`[AUTH] Attempt for: ${email}`);

    if (!email || !password) {
      console.log("[AUTH] Missing email or password");
      return { success: false, error: "Email and password are required." };
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    const user = await prisma.adminUser.findUnique({
      where: { email: cleanEmail, is_active: true },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        role: true,
        is_active: true,
        failed_attempts: true,
        locked_until: true,
        last_failed_attempt: true,
        created_at: true,
        updated_at: true,
        is_default_password: true
      }
    });

    if (!user) {
      console.log("[AUTH] User not found");
      return { success: false, error: "Invalid credentials" };
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      console.log("[AUTH] Account is locked");
      const timeRemainingMs = new Date(user.locked_until).getTime() - Date.now();
      const timeRemainingMinutes = Math.ceil(timeRemainingMs / 60000);
      
      if (timeRemainingMinutes < 1) {
        await prisma.adminUser.update({
          where: { id: user.id },
          data: { locked_until: null }
        });
      } else {
        const timeString = timeRemainingMinutes < 60 
          ? `${timeRemainingMinutes} minute${timeRemainingMinutes !== 1 ? 's' : ''}`
          : `${Math.ceil(timeRemainingMinutes / 60)} hour${Math.ceil(timeRemainingMinutes / 60) !== 1 ? 's' : ''}`;
        
        return { 
          success: false, 
          error: `Account locked due to too many failed attempts. Please try again in ${timeString}.`,
          lockedUntil: user.locked_until.toISOString(),
          cooldownMinutes: timeRemainingMinutes
        };
      }
    }

    const currentFailedAttempts = user.failed_attempts || 0;

    const isValidPassword = await bcrypt.compare(cleanPassword, user.password_hash);

    if (!isValidPassword) {
      console.log("[AUTH] Invalid password");

      const newAttempts = currentFailedAttempts + 1;
      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (newAttempts % MAX_FAILED_ATTEMPTS));
      
      const lockoutDuration = getLockoutDuration(newAttempts);
      
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { 
          failed_attempts: newAttempts,
          last_failed_attempt: new Date(),
          locked_until: lockoutDuration > 0 ? new Date(Date.now() + lockoutDuration * 60 * 1000) : null
        }
      });

      if (lockoutDuration > 0) {
        const timeString = lockoutDuration < 60 
          ? `${lockoutDuration} minute${lockoutDuration !== 1 ? 's' : ''}`
          : `${Math.ceil(lockoutDuration / 60)} hour${Math.ceil(lockoutDuration / 60) !== 1 ? 's' : ''}`;
        
        return { 
          success: false, 
          error: `Too many failed attempts. Account locked for ${timeString}. You can try again after the cooldown period.`,
          attemptsRemaining: 0,
          lockedUntil: new Date(Date.now() + lockoutDuration * 60 * 1000).toISOString(),
          cooldownMinutes: lockoutDuration
        };
      }

      return { 
        success: false, 
        error: `Invalid credentials. ${remaining} attempts remaining before account lock.`,
        attemptsRemaining: remaining
      };
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { 
        failed_attempts: 0, 
        locked_until: null,
        last_failed_attempt: null
      }
    });

    console.log("[AUTH] checkLoginAttempt result: User object returned");

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_default_password: user.is_default_password,
      }
    };
  } catch (error: any) {
    console.error("[AUTH] Error in checkLoginAttempt:", error);
    return { success: false, error: "An error occurred. Please try again." };
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    console.log(`[AUTH] Password reset requested for: ${email}`);

    if (!email || !email.includes('@')) {
      return { success: false, error: "Please provide a valid email address." };
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.adminUser.findUnique({
      where: { email: cleanEmail, is_active: true },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
    }

    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 10);

    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        password_hash: hash,
        is_default_password: true,
        failed_attempts: 0,
        locked_until: null
      }
    });

    const { sendEmail } = await import("@/actions/email");
    await sendEmail(
      user.email,
      "Password Reset - SocialBluePro",
      `<h1>Password Reset</h1>
       <p>Hi ${user.name},</p>
       <p>Your temporary password is: <strong>${tempPassword}</strong></p>
       <p>Please login and change your password immediately.</p>
       <p>If you did not request this reset, please contact support.</p>`,
      true,
      'password_reset'
    );

    console.log(`[AUTH] Password reset email sent to: ${user.email}`);
    return { success: true, message: "If an account exists with this email, a password reset has been sent." };
  } catch (error: any) {
    console.error("[AUTH] Error in requestPasswordReset:", error);
    return { success: false, error: "Failed to request password reset. Please try again." };
  }
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    if (!data.name || !data.email || !data.password) {
      return { success: false, error: "Name, email, and password are required." };
    }

    if (!data.email.includes('@')) {
      return { success: false, error: "Invalid email address." };
    }

    if (data.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const existingUser = await prisma.adminUser.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.adminUser.create({
       data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: data.role || 'admin',
        is_active: true,
        failed_attempts: 0,
        is_default_password: false
      }
    });
    return { success: true, user };
  } catch (error: any) {
    console.error("[AUTH] Error creating admin user:", error);
    return { success: false, error: error.message || "Failed to create user." };
  }
}
