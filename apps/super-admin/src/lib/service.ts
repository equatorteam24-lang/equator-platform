import { createClient } from '@supabase/supabase-js'

// Server-only service client (bypasses RLS)
// Never import this in client components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
