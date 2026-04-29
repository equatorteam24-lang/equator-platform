// ─── Database Types ───────────────────────────────────────────────────────────
// These mirror the Supabase schema exactly.
// Run `pnpm supabase gen types` to regenerate after schema changes.

export type OrganizationStatus = 'active' | 'suspended' | 'trial'
export type UserRole = 'superadmin' | 'team' | 'admin' | 'editor'
export type LeadStatus = 'new' | 'in_progress' | 'closed' | 'spam'
export type PaymentStatus = 'paid' | 'unpaid' | 'overdue' | 'trial'
export type PageStatus = 'published' | 'draft'

// ─── Organizations (client sites) ────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  domain: string | null
  slug: string                     // used in URL: admin.uniframe.app/org/:slug
  status: OrganizationStatus
  payment_status: PaymentStatus
  paid_until: string | null        // ISO date
  plan: string | null              // 'basic' | 'pro' etc.
  settings: OrganizationSettings
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  logo_url?: string
  primary_color?: string
  contact_email?: string
  notification_email?: string      // where leads are sent
  telegram_chat_id?: string
  google_analytics_id?: string     // G-XXXXXXXXXX
  meta_pixel_id?: string           // Facebook/Meta Pixel ID
  custom_head_scripts?: string     // arbitrary <script> tags for <head>
  custom_body_scripts?: string     // arbitrary scripts before </body>
  custom_script_files?: ScriptFile[] // uploaded .js/.css files
}

export interface ScriptFile {
  url: string
  name: string
  type: 'js' | 'css'
  position: 'head' | 'body'        // where to inject
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string                       // = auth.users.id
  org_id: string | null            // null = superadmin
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

// ─── Pages (CMS) ─────────────────────────────────────────────────────────────

export interface Page {
  id: string
  org_id: string
  slug: string                     // e.g. '/' | '/about' | '/contact'
  title: string
  status: PageStatus
  seo: PageSeo
  content: PageContent             // JSON — blocks or raw html
  created_at: string
  updated_at: string
}

export interface PageSeo {
  meta_title?: string
  meta_description?: string
  og_image?: string
  canonical?: string
  no_index?: boolean
  structured_data?: Record<string, unknown>
}

export interface PageContent {
  blocks: ContentBlock[]
}

export interface ContentBlock {
  id: string
  type: 'hero' | 'text' | 'image' | 'cta' | 'faq' | 'testimonials' | 'custom'
  props: Record<string, unknown>
}

// ─── Leads (CRM) ─────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  org_id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  source_page: string | null       // which page the form was on
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Analytics Events ─────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string
  org_id: string
  session_id: string
  event: string                    // 'pageview' | 'click' | 'form_submit'
  page: string
  referrer: string | null
  country: string | null
  device: string | null            // 'mobile' | 'tablet' | 'desktop'
  created_at: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  org_id: string | null
  user_id: string | null
  action: string                   // e.g. 'lead.status_changed'
  resource: string                 // e.g. 'leads'
  resource_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip: string | null
  created_at: string
}

// ─── Database shape (for Supabase client typing) ──────────────────────────────

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Organization> }
      profiles:       { Row: Profile;      Insert: Omit<Profile, 'created_at'>;                             Update: Partial<Profile> }
      pages:          { Row: Page;         Insert: Omit<Page, 'id' | 'created_at' | 'updated_at'>;          Update: Partial<Page> }
      leads:          { Row: Lead;         Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>;          Update: Partial<Lead> }
      analytics_events: { Row: AnalyticsEvent; Insert: Omit<AnalyticsEvent, 'id'>; Update: never }
      audit_logs:     { Row: AuditLog;     Insert: Omit<AuditLog, 'id'>;                                    Update: never }
    }
  }
}
