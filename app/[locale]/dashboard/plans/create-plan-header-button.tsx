import { createClient } from '@/lib/supabase/server'
import CreatePlanModal from '@/components/audit/create-plan-modal'

type Props = {
  role: string
  companyId?: string | null
}

export default async function CreatePlanHeaderButton({ role, companyId }: Props) {
  const supabase = await createClient()

  const [
    companiesResult,
    departmentsResult,
    templatesResult,
    allProfilesResult,
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true }),
    supabase
      .from('departments')
      .select('id, name, company_id')
      .order('name', { ascending: true }),
    supabase
      .from('audit_templates')
      .select(`
        id,
        title,
        template_sections(
          id,
          title,
          sort_order
        )
      `)
      .order('title', { ascending: true }),
    supabase.from('profiles').select('id, full_name, role, company_id'),
  ])

  const companies = companiesResult.data || []
  const departments = departmentsResult.data || []
  const templates = templatesResult.data || []
  const allProfiles = allProfilesResult.data || []

  const auditors = getAssignableUsers({
    role,
    currentCompanyId: companyId,
    allProfiles,
  })

  return (
    <CreatePlanModal
      companies={companies}
      departments={departments}
      auditors={auditors}
      templates={templates}
    />
  )
}

function getAssignableUsers({
  role,
  currentCompanyId,
  allProfiles,
}: {
  role: string
  currentCompanyId?: string | null
  allProfiles: any[]
}) {
  if (role === 'audit_muavini') {
    return allProfiles.filter(
      (profile: any) =>
        profile.role === 'auditor' &&
        String(profile.company_id || '') === String(currentCompanyId || '')
    )
  }

  if (role === 'admin' || role === 'rehber') {
    return allProfiles.filter((profile: any) => profile.role !== 'admin')
  }

  return []
}