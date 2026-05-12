import { createClient } from '@/lib/supabase/server'
import PlansListSection from './plans-list-section'

type Props = {
  userId: string
  role: string
  currentCompanyId?: string | null
  q: string
  status: string
  companyId: string
  page: number
}

export default async function PlansContentSection({
  userId,
  role,
  currentCompanyId,
  q,
  status,
  companyId,
  page,
}: Props) {
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

  const assignableUsers = getAssignableUsers({
    role,
    currentCompanyId,
    allProfiles,
  })

  const canCreatePlan =
    role === 'admin' || role === 'rehber' || role === 'audit_muavini'
  const isReadOnlyObserver = role === 'musahideci'

  return (
    <PlansListSection
      userId={userId}
      role={role}
      q={q}
      status={status}
      companyId={companyId}
      page={page}
      allProfiles={allProfiles}
      assignableUsers={assignableUsers}
      companies={companies}
      departments={departments}
      templates={templates}
      canCreatePlan={canCreatePlan}
      isReadOnlyObserver={isReadOnlyObserver}
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