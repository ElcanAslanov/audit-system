import { createClient } from '@/lib/supabase/server'
import CreatePlanModal from '@/components/audit/create-plan-modal'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import PlansViewSwitcher from '@/components/audit/plans-view-switcher'
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  Search,
  ShieldAlert,
} from 'lucide-react'

type PageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    company_id?: string
    page?: string
  }>
}


function formatDate(value?: string | null) {
  if (!value) return '-'

  const raw = String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const [, year, month, day] = match
    return `${day}.${month}.${year}`
  }

  return raw
}


export default async function PlansPage({ searchParams }: PageProps) {
  const t = await getTranslations('plans')
  const common = await getTranslations('common')

  const statusLabel = (value?: string | null) => {
    if (value === 'tamamlandi') return t('completed')
    if (value === 'needs_attention') return t('needsAttention')
    if (value === 'planlanan') return t('planned')
    return value || '-'
  }

  const params = await searchParams

  const q = params?.q?.trim() || ''
  const status = params?.status || ''
  const companyId = params?.company_id || ''
  const page = Math.max(Number(params?.page || 1), 1)
  const pageSize = 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1


  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  const isAdmin = role === 'admin'
  const isMusahideci = role === 'musahideci'
  const canViewAllPlans = isAdmin || isMusahideci
  const { data: assignedRows } = await supabase
    .from('plan_assignments')
    .select('plan_id')
    .eq('user_id', user.id)

  const { data: viewerRows } = await supabase
    .from('audit_plan_viewers')
    .select('plan_id')
    .eq('user_id', user.id)

  const assignedPlanIds = (assignedRows || [])
    .map((row: any) => row.plan_id)
    .filter(Boolean)

  const viewerPlanIds = (viewerRows || [])
    .map((row: any) => row.plan_id)
    .filter(Boolean)

  const visiblePlanIds = Array.from(
    new Set([...assignedPlanIds, ...viewerPlanIds])
  )



  if (!profile) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Profil tapılmadı.
      </div>
    )
  }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id')

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true })

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, company_id')
    .order('name', { ascending: true })

  const { data: templates } = await supabase
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
    .order('title', { ascending: true })

  let assignableUsers: any[] = []

  if (allProfiles) {
    if (role === 'audit_muavini') {
      assignableUsers = allProfiles.filter(
        (p: any) =>
          p.role === 'auditor' &&
          String(p.company_id || '') === String(profile.company_id || '')
      )
    } else if (role === 'admin' || role === 'rehber') {
      assignableUsers = allProfiles.filter((p: any) => p.role !== 'admin')
    }
  }

  let planQuery = supabase
    .from('audit_plans')
    .select(
      `
      *,
      companies(name),
      plan_assignments(user_id, profiles(id, full_name)),
      audit_plan_viewers(
        user_id,
        profiles!audit_plan_viewers_user_id_fkey(id, full_name)
      ),
      audit_answers(id),
      audit_plan_templates(
        template_id
      ),
      audit_plan_template_sections(
        template_id,
        section_id
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })



  if (status) {
    planQuery = planQuery.eq('status', status)
  }

  if (companyId) {
    planQuery = planQuery.eq('company_id', companyId)
  }

  if (q) {
    planQuery = planQuery.or(`title.ilike.%${q}%,department.ilike.%${q}%`)
  }

  const { data: rawPlans, error: planError } = await planQuery

  let visiblePlans = rawPlans || []

  if (!canViewAllPlans) {
    visiblePlans = visiblePlans.filter((plan: any) => {
      const isCreatedByMe = plan.created_by === user.id

      const isAssignedToMe = (plan.plan_assignments || []).some(
        (item: any) => item.user_id === user.id
      )

      const isViewer = (plan.audit_plan_viewers || []).some(
        (item: any) => item.user_id === user.id
      )

      return isCreatedByMe || isAssignedToMe || isViewer
    })
  }

  const totalPlans = visiblePlans.length
  const totalPages = Math.max(Math.ceil(totalPlans / pageSize), 1)
  const plans = visiblePlans.slice(from, to + 1)

  const makePageHref = (nextPage: number) => {
    const search = new URLSearchParams()

    if (q) search.set('q', q)
    if (status) search.set('status', status)
    if (companyId) search.set('company_id', companyId)
    search.set('page', String(nextPage))

    return `/dashboard/plans?${search.toString()}`
  }

  if (planError) {
    console.error('Planları çəkərkən xəta:', planError)
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Planları yükləmək mümkün olmadı: {planError.message}
      </div>
    )
  }

  const normalizedPlans = (plans || []).map((plan: any) => ({
    ...plan,
    companies: Array.isArray(plan.companies)
      ? plan.companies[0] || null
      : plan.companies || null,
  }))

  const plansByDeadline = [...normalizedPlans].sort((a: any, b: any) => {
    const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
    const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER

    return aTime - bTime
  })

  const completedCount = normalizedPlans.filter(
    (plan: any) => plan.status === 'tamamlandi'
  ).length

  const riskCount = normalizedPlans.filter(
    (plan: any) => plan.status === 'needs_attention'
  ).length

  const plannedCount = normalizedPlans.filter(
    (plan: any) => !plan.status || plan.status === 'planlanan'
  ).length

  const selectedCompany = (companies || []).find(
    (company: any) => company.id === companyId
  )

  const hasFilters = Boolean(q || status || companyId)
  const canCreatePlan =
    role === 'admin' || role === 'rehber' || role === 'audit_muavini'
  const isReadOnlyObserver = role === 'musahideci'


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {t('title')}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {t('subtitle')}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {canCreatePlan && (
                <CreatePlanModal
                  companies={companies || []}
                  departments={departments || []}
                  auditors={assignableUsers}
                  templates={templates || []}
                />
              )}

              <Link
                href="/dashboard/compare"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                <BarChart3 size={16} />
                {t('compare')}
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">{t('planned')}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {plannedCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <ClipboardCheck size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-700">
                  {t('completed')}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {completedCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-red-700">
                  {t('needsAttention')}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {riskCount}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-700">
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Filter size={17} className="text-slate-500" />
                <h2 className="text-lg font-black text-slate-950">
                  {t('filters')}
                </h2>
              </div>
            </div>

            {hasFilters && (
              <Link
                href="/dashboard/plans"
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                {t('clearFilters')}
              </Link>
            )}
          </div>

          <form className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                {common('search')}
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                {common('status')}
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">{t('statusAll')}</option>
                <option value="planlanan">{t('planned')}</option>
                <option value="tamamlandi">{t('completed')}</option>
                <option value="needs_attention">{t('needsAttention')}</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                {common('company')}
              </label>
              <select
                name="company_id"
                defaultValue={companyId}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">{t('companyAll')}</option>
                {(companies || []).map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end lg:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {common('filter')}
              </button>
            </div>
          </form>

          {hasFilters && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {q && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                  {common('search')}: {q}
                </span>
              )}

              {status && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
                  {common('status')}: {statusLabel(status)}
                </span>
              )}

              {companyId && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                  {common('company')}: {selectedCompany?.name || companyId}
                </span>
              )}
            </div>
          )}
        </section>

        <PlansViewSwitcher
          plans={normalizedPlans}
          allUsers={allProfiles || []}
          auditors={assignableUsers}
          companies={companies || []}
          departments={departments || []}
          templates={templates || []}
          canCreatePlan={canCreatePlan}
          currentUserId={user.id}
          currentUserRole={role || undefined}
          isReadOnlyObserver={isReadOnlyObserver}
        />

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            {t('pageInfo', { page, totalPages, totalPlans })}
          </p>

          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={makePageHref(page - 1)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {t('previous')}
              </Link>
            ) : (
              <span className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-300">
                {t('previous')}
              </span>
            )}

            {page < totalPages ? (
              <Link
                href={makePageHref(page + 1)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                {t('next')}
              </Link>
            ) : (
              <span className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-300">
                {t('next')}
              </span>
            )}
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                {t('deadlineOrder')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('deadlineOrderDescription')}
              </p>
            </div>

            <span className="w-fit rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">
              {t('nearToFar')}
            </span>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {plansByDeadline.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {t('noPlansDescription')}
                </div>
              )}

              {plansByDeadline.map((plan: any, index: number) => (
                <article
                  key={plan.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        #{index + 1}
                      </p>

                      <Link
                        href={`/dashboard/plans/${plan.id}`}
                        className="mt-1 block line-clamp-2 text-base font-black leading-snug text-slate-950 hover:text-blue-600"
                      >
                        {plan.title}
                      </Link>

                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-500">
                        {plan.companies?.name || '-'}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {statusLabel(plan.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                        {t('department')}
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        {plan.department || '-'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                        {t('startDate')}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatDate(plan.start_date)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-wide text-yellow-700/70">
                        {t('deadline')}
                      </p>
                      <p className="mt-1 text-sm font-black text-yellow-800">
                        {plan.due_date ? formatDate(plan.due_date) : t('noDeadline')}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                        {common('status')}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {statusLabel(plan.status)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/dashboard/plans/${plan.id}`}
                      className="inline-flex w-full justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t('view')}
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-black text-slate-600">
                        #
                      </th>
                      <th className="px-4 py-3 text-left font-black text-slate-600">
                        {t('plan')}
                      </th>
                      <th className="px-4 py-3 text-left font-black text-slate-600">
                        {common('company')}
                      </th>
                      <th className="px-4 py-3 text-left font-black text-slate-600">
                        {t('department')}
                      </th>
                      <th className="px-4 py-3 text-left font-black text-slate-600">
                        {t('startDate')}
                      </th>
                      <th className="px-4 py-3 text-left font-black text-slate-600">
                        {t('deadline')}
                      </th>
                      <th className="px-4 py-3 text-left font-black text-slate-600">
                        {common('status')}
                      </th>
                      <th className="px-4 py-3 text-right font-black text-slate-600">
                        {t('view')}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {plansByDeadline.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          {t('noPlansDescription')}
                        </td>
                      </tr>
                    )}

                    {plansByDeadline.map((plan: any, index: number) => (
                      <tr key={plan.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/plans/${plan.id}`}
                            className="font-black text-slate-900 hover:text-blue-600"
                          >
                            {plan.title}
                          </Link>
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {plan.companies?.name || '-'}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {plan.department || '-'}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {formatDate(plan.start_date)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-black ${plan.due_date
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-slate-100 text-slate-500'
                              }`}
                          >
                            {plan.due_date ? formatDate(plan.due_date) : t('noDeadline')}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {statusLabel(plan.status)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/plans/${plan.id}`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            {t('view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}