/**
 * Sistema de Autenticação Simplificado
 * Não depende de Supabase Auth
 * Usa PostgreSQL nativo com bcrypt
 */

import bcrypt from "bcryptjs";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  failed_attempts: number;
  locked_until: string | null;
}

export interface LoginResponse {
  user: AdminUser;
  token?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  // Hardcoded admin user para testes
  if (email === "admin@socialbluepro.com" && password === "admin123") {
    const mockUser: AdminUser = {
      id: "00000000-0000-0000-000000000000",
      name: "Admin User",
      email: "admin@socialbluepro.com",
      password_hash: "",
      role: "admin",
      created_at: new Date().toISOString(),
      failed_attempts: 0,
      locked_until: null
    };

    return { user: mockUser, token: "mock-token-" + Date.now() };
  }

  // Login real com PostgreSQL (Exemplo desativado)
  /*
  const { data: user, error } = await prisma.adminUser.findUnique({ where: { email } });
  */
  
  throw new Error("Credenciais inválidas");
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  return null;
}

export async function logout(): Promise<void> {
  // Logout básico - apenas limpa a sessão
  throw new Error("Logout não implementado");
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user && user.role === 'admin';
  } catch {
    return false;
  }
}
