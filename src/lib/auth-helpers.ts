/**
 * Auth Helpers - Não depende de NextAuth ou Supabase
 * Use para verificação simples de autenticação
 */

export type AuthUser = {
  id: string
  email: string
  name: string
  role: string
}

export type AuthSession = {
  user: AuthUser | null
}

export function isAuthenticated(session: AuthSession | null): boolean {
  return !!session?.user
}

export function isAdmin(session: AuthSession | null): boolean {
  return session?.user?.role === 'admin'
}

export function hasRole(session: AuthSession | null, roles: string[]): boolean {
  if (!session?.user) return false
  return roles.includes(session.user.role)
}
