import { NextRequest, NextResponse } from "next/server";
import { checkLoginAttempt } from "@/actions/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    error: null,
    providers: ["credentials"],
    csrfToken: null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    const user = await checkLoginAttempt(email, password);

    if (!user) {
      return Response.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Create session token (matching auth.ts expectations)
    const tokenData = {
      id: user.id,
      email: user.email,
      ts: Date.now(),
      isDefaultPassword: false, // TODO: detect default password
    };
    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64url");

    // Set cookie (optional, frontend may handle)
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { name: user.name, role: user.role }
      },
      success: true,
      token, // include token for client-side storage
    });

    // Set HTTP-only cookie for session
    response.cookies.set({
      name: "sbp_admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;

  } catch (error: any) {
    console.error("Login API error:", error);
    return Response.json({ 
      error: error.message || "Erro interno do servidor" 
    }, { status: 500 });
  }
}
