// Roles allowed to access the super-admin dashboard
const DASHBOARD_ROLES = ['superadmin', 'team'] as const

export type DashboardRole = (typeof DASHBOARD_ROLES)[number]

export function canAccessDashboard(role: string | null | undefined): role is DashboardRole {
  return DASHBOARD_ROLES.includes(role as DashboardRole)
}

export function isSuperadmin(role: string | null | undefined): boolean {
  return role === 'superadmin'
}
