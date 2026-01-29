import { cookies } from "next/headers";

const COOKIE_NAME = "sbp_admin_token";

export interface Session {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    isDefaultPassword?: boolean;
  };
  expires?: string;
}

export async function auth(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    // Current implementation uses base64url encoded JSON
    // Note: In production this should be a proper signed JWT
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
    
    // Check expiration (8 hours TTL used in login route)
    const eightHoursMs = 8 * 60 * 60 * 1000;
    if (Date.now() - decoded.ts > eightHoursMs) {
      return null;
    }

    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        isDefaultPassword: decoded.isDefaultPassword,
        // Name and role aren't in the token currently, but we could add them
        // For now, return what we have
      }
    };
  } catch (e) {
    return null;
  }
}

export function signIn() {
  return null
}

export function signOut() {
  return null
}

export function checkLoginAttempt() {
  return null
}

export function createUser() {
  return null
}

export const handlers = {}
