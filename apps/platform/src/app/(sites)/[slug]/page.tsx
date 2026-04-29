import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/service'
import type { Metadata } from 'next'

async function getSiteData(slug: string) {
  const db = createServiceClient()

  // Find org by slug
  const { data: org } = await db
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle()

  if (!org) return null

  // Find published site project for this org
  const { data: project } = await db
    .from('site_projects')
    .select('id, name, vercel_url, production_url')
    .eq('org_id', org.id)
    .eq('status', 'published')
    .maybeSingle()

  if (!project?.vercel_url) return null

  return { org, project }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getSiteData(slug)
  if (!data) return {}

  return {
    title: data.org.name,
    description: `${data.org.name} — офіційний сайт`,
  }
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getSiteData(slug)

  if (!data) notFound()

  return (
    <iframe
      src={data.project.vercel_url}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
      }}
    />
  )
}
