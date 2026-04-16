import { getCurrentOrgId } from '@/lib/org'
import PageEditor from '../PageEditor'

export default async function NewPagePage() {
  const orgId = await getCurrentOrgId()
  return <PageEditor orgId={orgId} />
}
