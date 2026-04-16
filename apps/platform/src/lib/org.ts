// ORG_ID is set per-site in .env.local
// All DB queries must filter by this ID — enforced by RLS too
export const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID!

export function requireOrgId(): string {
  if (!ORG_ID) throw new Error('NEXT_PUBLIC_ORG_ID is not set')
  return ORG_ID
}
