import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Use in Server Components and Server Actions
export async function createClient() {
  const cookieStore = await cookies()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll: (cookiesToSet: any[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
