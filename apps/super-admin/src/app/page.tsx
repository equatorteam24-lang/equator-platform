import { redirect } from 'next/navigation'

// Root redirects to organizations dashboard
export default function RootPage() {
  redirect('/organizations')
}
