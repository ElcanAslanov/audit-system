import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import PlansViewSwitcher from '@/components/audit/plans-view-switcher'

type Props = {
  userId: string
  role: string
  q: string
  status: string
  companyId: string
  page: number
  allProfiles: any[]
  assignableUsers: any[]
  companies: any[]
  departments: any[]
  templates: any[]
  canCreatePlan: boolean
  isReadOnlyObserver: boolean
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

export default async function PlansListSection({
  userId,
  role,
  q,
  status,
  companyId,
  page,
  allProfiles,
  assignableUsers,
  companies,
  departments,
  templates,
  canCreatePlan,
  isReadOnlyObserver,
}: Props) {
  const t = await getTranslations('plans')
  const common = await getTranslations('common')

  const statusLabel = (value?: string | null) => {
    if (value === 'tamamlandi') return t('completed')
    if (value === 'needs_attention') return t('needsAttention')
    if (value === 'planlanan') return t('planned')
    return value || '-'
  }

  const pageSize = 12
  const safePage = Math.max(Number(page || 1), 1)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  const isAdmin = role === 'admin'
  const isMusahideci = role === 'musahideci'
  const canViewAllPlans = isAdmin || isMusahideci

  let assignedPlanIds: string[] = []
  let viewerPlanIds: string[] = []

  if (!canViewAllPlans) {
    const [assignedRes, viewerRes] = await Promise.all([
      supabase.from('plan_assignments').select('plan_id').eq('user_id', userId),
      supabase
        .from('audit_plan_viewers')
        .select('plan_id')
        .eq('user_id', userId),
    ])

    assignedPlanIds = (assignedRes.data || [])
      .map((row: any) => row.plan_id)
      .filter(Boolean)

    viewerPlanIds = (viewerRes.data || [])
      .map((row: any) => row.plan_id)
      .filter(Boolean)
  }

  const visiblePlanIds = Array.from(
    new Set([...assignedPlanIds, ...viewerPlanIds])
  )

  let planQuery = supabase
    .from('audit_plans')
    .select(
      `
      *,
      companies(name),
      plan_assignments(user_id, profiles(id, full_name)),
      audit_plan_templates(template_id),
      audit_plan_template_sections(template_id, section_id)
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

  if (!canViewAllPlans) {
    const orParts = [`created_by.eq.${userId}`]

    if (visiblePlanIds.length > 0) {
      orParts.push(`id.in.(${visiblePlanIds.join(',')})`)
    }

    planQuery = planQuery.or(orParts.join(','))
  }

  planQuery = planQuery.range(from, to)

  const { data: rawPlans, error: planError, count: totalPlans } = await planQuery

  if (planError) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
        Planları yükləmək mümkün olmadı: {planError.message}
      </div>
    )
  }

  const plansSlice = rawPlans || []
  const totalCount = totalPlans || 0
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  const planIds = plansSlice.map((plan: any) => plan.id).filter(Boolean)

  const [answerRowsResult, viewerRowsResult] =
    planIds.length > 0
      ? await Promise.all([
          supabase
            .from('audit_answers')
            .select('plan_id')
            .in('plan_id', planIds),
          supabase
            .from('audit_plan_viewers')
            .select(
              `
              plan_id,
              user_id,
              profiles!audit_plan_viewers_user_id_fkey(id, full_name)
            `
            )
            .in('plan_id', planIds),
        ])
      : [{ data: [] }, { data: [] }]

  const answerCountMap = new Map<string, number>()

  for (const row of answerRowsResult.data || []) {
    const key = String((row as any).plan_id)
    answerCountMap.set(key, (answerCountMap.get(key) || 0) + 1)
  }

  const viewerProfileMap = new Map<string, any[]>()

  for (const row of viewerRowsResult.data || []) {
    const planId = String((row as any).plan_id)
    const list = viewerProfileMap.get(planId) || []
    list.push(row)
    viewerProfileMap.set(planId, list)
  }

  const normalizedPlans = plansSlice.map((plan: any) => {
    const answerCount = answerCountMap.get(String(plan.id)) || 0
    const viewers = viewerProfileMap.get(String(plan.id)) || []

    return {
      ...plan,
      companies: Array.isArray(plan.companies)
        ? plan.companies[0] || null
        : plan.companies || null,
      audit_answers: answerCount > 0 ? new Array(answerCount).fill({}) : [],
      audit_plan_viewers: viewers,
    }
  })

  const plansByDeadline = [...normalizedPlans].sort((a: any, b: any) => {
    const aTime = a.due_date
      ? new Date(a.due_date).getTime()
      : Number.MAX_SAFE_INTEGER

    const bTime = b.due_date
      ? new Date(b.due_date).getTime()
      : Number.MAX_SAFE_INTEGER

    return aTime - bTime
  })

  const makePageHref = (nextPage: number) => {
    const search = new URLSearchParams()

    if (q) search.set('q', q)
    if (status) search.set('status', status)
    if (companyId) search.set('company_id', companyId)

    search.set('page', String(nextPage))

    return `/dashboard/plans?${search.toString()}`
  }

  return (
    <>
      <PlansViewSwitcher
        plans={normalizedPlans}
        allUsers={allProfiles}
        auditors={assignableUsers}
        companies={companies}
        departments={departments}
        templates={templates}
        canCreatePlan={canCreatePlan}
        currentUserId={userId}
        currentUserRole={role || undefined}
        isReadOnlyObserver={isReadOnlyObserver}
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">
          {t('pageInfo', {
            page: safePage,
            totalPages,
            totalPlans: totalCount,
          })}
        </p>

        <div className="flex gap-2">
          {safePage > 1 ? (
            <Link
              href={makePageHref(safePage - 1)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {t('previous')}
            </Link>
          ) : (
            <span className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-300">
              {t('previous')}
            </span>
          )}

          {safePage < totalPages ? (
            <Link
              href={makePageHref(safePage + 1)}
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

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {statusLabel(plan.status)}
                  </span>

                  <Link
                    href={`/dashboard/plans/${plan.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {t('view')}
                  </Link>
                </div>
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
                    {plan.due_date
                      ? formatDate(plan.due_date)
                      : t('noDeadline')}
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
            </article>
          ))}
        </div>

        <div className="hidden rounded-2xl border border-slate-200 lg:block">
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
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${
                          plan.due_date
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {plan.due_date
                          ? formatDate(plan.due_date)
                          : t('noDeadline')}
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
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
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
      </section>
    </>
  )
}