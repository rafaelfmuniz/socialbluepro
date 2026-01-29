import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiZXhwIjoxOTk5OTk5OTk5fQ.8RUB8Cap5VAEb4UXQl0Es8CMQVdL7Klw4ppIWh81C-o";

let clientInstance: ReturnType<ReturnType<typeof createBrowserClient>> | null = null

export function createClient() {
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}

export async function getSupabaseUser() {
  try {
    const client = createClient()
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error in getSupabaseUser:', error)
    return null
  }
}
