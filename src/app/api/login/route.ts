import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { checkLoginAttempt, requestPasswordReset } from "../../../actions/auth";

const COOKIE_NAME = "sbp_admin_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function buildSessionToken(payload: Record<string, unknown>) {
  const data = {
    ...payload,
    ts: Date.now(),
  };
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password: rawPassword, action } = await request.json();
    const email = rawEmail?.trim();
    const password = rawPassword?.trim();

    console.log(`[LOGIN API] Email: "${email}" (Length: ${email?.length})`);
    console.log(`[LOGIN API] Password Length: ${password?.length}`);
    console.log(`[LOGIN API] Action: ${action}`);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (action === "reset") {
      const result = await requestPasswordReset(email);
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message || "Password reset email sent."
        });
      }
      return NextResponse.json(
        { error: result.error || "Failed to send reset email." },
        { status: 400 }
      );
    }

    const user = await checkLoginAttempt(email, password);
    console.log("checkLoginAttempt result:", user ? JSON.stringify({ success: user.success, hasUser: !!user.user, attemptsRemaining: user.attemptsRemaining }) : "null returned");

    if (!user || !user.success || !user.user) {
      const statusCode = user?.lockedUntil ? 423 : 401;
      return NextResponse.json(
        {
          error: user?.error || "Invalid credentials.",
          attemptsRemaining: user?.attemptsRemaining,
          lockedUntil: user?.lockedUntil
        },
        { status: statusCode }
      );
    }

    const isDefaultPassword = user.user.is_default_password || (email === "admin@socialbluepro.com" && password === "admin123");

    const sessionToken = buildSessionToken({
      id: user.user.id,
      email: user.user.email,
      isDefaultPassword,
      nonce: crypto.randomUUID(),
    });

    const response = NextResponse.json({
      success: true,
      warning: isDefaultPassword ? "You are using the default password. Please change it immediately for security reasons." : undefined,
      user: {
        id: user.user.id,
        name: user.user.name,
        email: user.user.email,
        role: user.user.role,
        isDefaultPassword,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NEXTAUTH_URL?.startsWith('https://') || false,
      path: "/",
      maxAge: TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[LOGIN API] Error:", error);
    return NextResponse.json(
      { error: message || "Internal error" },
      { status: 500 }
    );
  }
}
